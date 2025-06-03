"use server";
import { db } from "..";
import { env } from "@itzam/utils/env";
import { getUser } from "../auth/actions";
import { checkPlanLimits, Knowledge } from "../knowledge/actions";
import { resources, resources as resourcesTable } from "../schema";
import { sendDiscordNotification } from "../../discord/actions";
import {
  customerIsSubscribedToItzamPro,
  customerIsSubscribedToItzamProForUserId,
} from "../billing/actions";
import { groupBy } from "lodash";
import { and, eq, not } from "drizzle-orm";

export type ResourceWithKnowledgeAndWorkflow = Awaited<
  ReturnType<typeof getResourcesToRescrape>
>[number];

export async function getResourcesToRescrape() {
  const resources = await db.query.resources.findMany({
    where: (resources, { and, eq, not }) =>
      and(
        not(eq(resources.scrapeFrequency, "NEVER")),
        not(eq(resources.type, "FILE"))
      ),
    with: {
      knowledge: {
        with: {
          workflow: true,
        },
      },
    },
  });

  return resources;
}

export async function createResourceAndSendoToAPI({
  knowledgeId,
  workflowId,
  resources,
}: {
  knowledgeId: string;
  workflowId: string;
  resources: Knowledge["resources"];
}) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  // check plan limits
  await checkPlanLimits(knowledgeId);

  // create resources in the database
  const createdResources = await db
    .insert(resourcesTable)
    .values(resources)
    .returning();

  const resourcesToSend = createdResources.map((resource) => ({
    type: resource.type,
    id: resource.id,
    url: resource.url,
  }));

  const handle = await fetch(
    `${env.PYTHON_KNOWLEDGE_API_URL}/api/v1/create-resource`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.session.session?.access_token}`,
      },
      body: JSON.stringify({
        knowledgeId,
        resources: resourcesToSend,
        userId: user.data.user.id,
        workflowId,
      }),
    }
  );

  return await handle.json();
}

// TODO: Improve error handling to user (send email when rescrape fails -- saying if it was because of the size or because of the frequency - cancelled Pro)
// Also, send discord notification for everything

export async function rescrapeResources(
  resources: ResourceWithKnowledgeAndWorkflow[]
) {
  // group resources by user
  // for each resource, check if the user is subscribed to Itzam Pro for HOURLY frequency
  // for each resource, check if lastScrapedAt is older than scrapeFrequency || lastScrapedAt is null
  // if true, validate if the user has reached the limit in this workflow (50MB) (fetch url, check old size and check if new size is bigger than the limit)
  // if true, send request to python to rescrape the resource (use RESCRAPE_CRON_SECRET to authenticate)
  // if false, do nothing

  // This will be sent to the python API
  const resourcesToRescrape = [];

  const resourcesGroupedByUserId = groupBy(
    resources,
    "knowledge.workflow.userId"
  );

  // For each user, check if they are subscribed to Itzam Pro for HOURLY frequency resources
  for (const userId in resourcesGroupedByUserId) {
    const resourcesByUser = resourcesGroupedByUserId[userId];

    const { isSubscribed } =
      await customerIsSubscribedToItzamProForUserId(userId);

    for (const resource of resourcesByUser || []) {
      // Remove resources that have HOURLY frequency if the user is not subscribed
      if (!isSubscribed && resource.scrapeFrequency === "HOURLY") {
        // TODO: Send email to user saying that they are not subscribed to Itzam Pro for HOURLY frequency
        continue;
      }

      // If scraping is not for now, skip
      const lastScrapedAt = resource.lastScrapedAt;
      if (
        lastScrapedAt &&
        lastScrapingIsNewerThanScrapeFrequency(
          lastScrapedAt,
          resource.scrapeFrequency
        )
      ) {
        continue;
      }

      // Check if new size is bigger than the limit
      if (await fileSizeExceedsPlanLimit(resource, isSubscribed)) {
        // TODO: Send email to user saying that they have reached the limit in this workflow
        continue;
      }

      resourcesToRescrape.push(resource);
    }
  }

  console.log("resourcesToRescrape", resourcesToRescrape);

  if (resourcesToRescrape.length === 0) {
    return;
  }

  for (const resource of resourcesToRescrape) {
    void fetch(`${env.PYTHON_KNOWLEDGE_API_URL}/api/v1/rescrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        knowledgeId: resource.knowledge?.id,
        resources: [
          {
            type: resource.type,
            id: resource.id,
            url: resource.url,
          },
        ],
        userId: resource.knowledge?.workflow.userId,
        workflowId: resource.knowledge?.workflow.id,
        rescrapeSecret: env.RESCRAPE_CRON_SECRET,
      }),
    });
  }
}

function lastScrapingIsNewerThanScrapeFrequency(
  lastScrapedAt: Date,
  scrapeFrequency: "HOURLY" | "DAILY" | "WEEKLY" | "NEVER"
) {
  const lastScrapedAtDate = new Date(lastScrapedAt);

  switch (scrapeFrequency) {
    case "HOURLY": {
      const nextScrapeAt = new Date(
        lastScrapedAt.setHours(lastScrapedAt.getHours() + 1)
      );

      console.log("scrapeFrequency", scrapeFrequency);
      console.log("nextScrapeAt", nextScrapeAt);
      console.log("lastScrapedAtDate", lastScrapedAtDate);

      return lastScrapedAtDate > nextScrapeAt;
    }
    case "DAILY": {
      const nextScrapeAt = new Date(
        lastScrapedAt.setDate(lastScrapedAt.getDate() + 1)
      );

      console.log("scrapeFrequency", scrapeFrequency);
      console.log("nextScrapeAt", nextScrapeAt);
      console.log("lastScrapedAtDate", lastScrapedAtDate);

      return lastScrapedAtDate > nextScrapeAt;
    }
    case "WEEKLY": {
      const nextScrapeAt = new Date(
        lastScrapedAt.setDate(lastScrapedAt.getDate() + 7)
      );

      console.log("scrapeFrequency", scrapeFrequency);
      console.log("nextScrapeAt", nextScrapeAt);
      console.log("lastScrapedAtDate", lastScrapedAtDate);

      return lastScrapedAtDate > nextScrapeAt;
    }
  }
}

async function fileSizeExceedsPlanLimit(
  resource: ResourceWithKnowledgeAndWorkflow,
  isSubscribedToItzamPro: boolean
) {
  const maxKnowledgeSize = isSubscribedToItzamPro
    ? 500 * 1024 * 1024
    : 50 * 1024 * 1024;

  // Get all resources in the knowledge
  const otherResourcesSize = await db.query.resources.findMany({
    where: and(
      eq(resources.knowledgeId, resource.knowledge?.id ?? ""),
      eq(resources.active, true),
      not(eq(resources.id, resource.id))
    ),
    columns: {
      fileSize: true,
    },
  });

  // Get the current total size of the knowledge
  const currentKnowledgeSizeInWorkflowWithoutCurrentResource =
    otherResourcesSize.reduce(
      (acc, resource) => acc + (resource.fileSize ?? 0),
      0
    );

  const fileResponse = await fetch(resource.url);

  if (!fileResponse.ok) {
    throw new Error("Could not fetch file");
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const type = fileResponse.headers.get("content-type") || resource.mimeType;

  if (!type) {
    throw new Error("Could not determine mime type");
  }

  const file = new File([buffer], resource.fileName || "file", {
    type,
  });

  if (
    file.size + currentKnowledgeSizeInWorkflowWithoutCurrentResource >
    maxKnowledgeSize
  ) {
    return true;
  }

  return false;
}
