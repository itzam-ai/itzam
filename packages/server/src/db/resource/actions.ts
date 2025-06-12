"use server";
import { env } from "@itzam/utils/env";
import { addDays, addHours, isAfter, isBefore } from "date-fns";
import { and, eq, not } from "drizzle-orm";
import { groupBy } from "lodash";
import { db } from "..";
import { sendDiscordNotification } from "../../discord/actions";
import { getUser } from "../auth/actions";
import { customerIsSubscribedToItzamProForUserId } from "../billing/actions";
import { checkPlanLimits, Knowledge } from "../knowledge/actions";
import { chunks, resources, resources as resourcesTable } from "../schema";

export type ResourceWithKnowledgeAndWorkflow = Awaited<
  ReturnType<typeof getResourcesToRescrape>
>[number];

export async function getResourcesToRescrape() {
  const resources = await db.query.resources.findMany({
    where: (resources, { and, eq, not }) =>
      and(
        not(eq(resources.scrapeFrequency, "NEVER")),
        eq(resources.type, "LINK"),
        eq(resources.active, true)
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

export async function updateRescrapeFrequency(
  resourceId: string,
  frequency: "NEVER" | "HOURLY" | "DAILY" | "WEEKLY"
) {
  await db
    .update(resourcesTable)
    .set({
      scrapeFrequency: frequency,
    })
    .where(eq(resourcesTable.id, resourceId));
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

// TODO: Improve error handling to user (send email when rescrape fails -- saying if it was because of the size)
// Also, send discord notification for everything

export async function rescrapeResources(
  resources: ResourceWithKnowledgeAndWorkflow[]
) {
  // group resources by user
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

  for (const userId in resourcesGroupedByUserId) {
    const resourcesByUser = resourcesGroupedByUserId[userId];

    console.log(
      `🐛 Checking ${resourcesByUser?.length ?? 0} resources for user ${userId}`
    );

    const { isSubscribed } =
      await customerIsSubscribedToItzamProForUserId(userId);

    for (const resource of resourcesByUser || []) {
      const lastScrapedAt = resource.lastScrapedAt;

      // If scraping is not for now, skip
      if (
        lastScrapedAt &&
        lastScrapingDateIsNewerThanScrapeFrequency(
          lastScrapedAt,
          resource.scrapeFrequency
        )
      ) {
        console.log(
          `🐛 Skipping resource ${resource.id} because it was scraped less than ${resource.scrapeFrequency} ago`
        );

        continue;
      }

      // Check if new size is bigger than the limit
      if (await fileSizeExceedsPlanLimit(resource, isSubscribed)) {
        // TODO: Send email to user saying that they have reached the limit in this workflow
        console.log(
          `🐛 Skipping resource ${resource.id} because it exceeds the plan size limit (50MB for free users, 500MB for paid users)`
        );

        void sendDiscordNotification({
          content: `🐛 Skipping resource ${resource.id} because it exceeds the plan size limit (50MB for free users, 500MB for paid users). 🗣️ Talk to user: ${userId}`,
        });

        continue;
      }

      console.log(`🐛 ${resource.id} passed the checks for user ${userId}`);

      resourcesToRescrape.push(resource);
    }
  }

  if (resourcesToRescrape.length === 0) {
    return;
  }

  for (const resource of resourcesToRescrape) {
    // Set old chunks to inactive to delete later
    await db
      .update(chunks)
      .set({
        active: false,
      })
      .where(eq(chunks.resourceId, resource.id));

    console.log(`🐛 Sending resource ${resource.id} to Python API`);

    const response = await fetch(
      `${env.PYTHON_KNOWLEDGE_API_URL}/api/v1/rescrape`,
      {
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
      }
    );

    if (!response.ok) {
      console.log(
        `🐛 Failed to rescrape resource ${resource.id} (status: ${response.status})`
      );

      // Update chunks back to active
      await db
        .update(chunks)
        .set({
          active: true,
        })
        .where(eq(chunks.resourceId, resource.id));
      continue;
    }

    console.log(`🐛 Successfully ✅ rescraped resource ${resource.id}`);

    // Delete old chunks
    await db
      .delete(chunks)
      .where(and(eq(chunks.resourceId, resource.id), eq(chunks.active, false)));

    // Update resource lastScrapedAt
    await db
      .update(resourcesTable)
      .set({
        lastScrapedAt: new Date(),
      })
      .where(eq(resourcesTable.id, resource.id));
  }

  console.log(
    `🐛 Successfully ✅ rescraped ${resourcesToRescrape.length} resources`
  );

  void sendDiscordNotification({
    content: `🐛 Successfully ✅ rescraped ${resourcesToRescrape.length} resources`,
  });
}

function lastScrapingDateIsNewerThanScrapeFrequency(
  lastScrapedAt: Date,
  scrapeFrequency: "HOURLY" | "DAILY" | "WEEKLY" | "NEVER"
) {
  const now = new Date();

  console.log(`🐛 now: ${now}`);
  console.log(`🐛 lastScrapedAt: ${lastScrapedAt}`);

  switch (scrapeFrequency) {
    case "HOURLY": {
      const nextScrapeAt = addHours(lastScrapedAt, 1);
      console.log(`🐛 nextScrapeAt: ${nextScrapeAt}`);
      return isBefore(now, nextScrapeAt);
    }
    case "DAILY": {
      const nextScrapeAt = addDays(lastScrapedAt, 1);
      console.log(`🐛 nextScrapeAt: ${nextScrapeAt}`);
      return isBefore(now, nextScrapeAt);
    }
    case "WEEKLY": {
      const nextScrapeAt = addDays(lastScrapedAt, 7);
      console.log(`🐛 nextScrapeAt: ${nextScrapeAt}`);
      return isBefore(now, nextScrapeAt);
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
