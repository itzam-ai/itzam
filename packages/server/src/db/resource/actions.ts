"use server";
import { env } from "@itzam/utils/env";
import { addDays, addHours, addMinutes, isBefore } from "date-fns";
import { and, eq, inArray, not, or } from "drizzle-orm";
import { groupBy } from "lodash";
import { revalidatePath } from "next/cache";
import { db } from "..";
import { sendDiscordNotification } from "../../discord/actions";
import { getUser } from "../auth/actions";
import { getCustomerSubscriptionStatusForUserId } from "../billing/actions";
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
      context: {
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
  workflowId,
  resources,
  knowledgeId,
  contextId,
}: {
  workflowId: string;
  resources: Knowledge["resources"];
  knowledgeId: string;
  contextId: string;
}) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  // check plan limits
  await checkPlanLimits(workflowId);

  // create resources in the database
  const createdResources = await db
    .insert(resourcesTable)
    .values(resources)
    .returning();

  await sendDiscordNotification({
    content: `🏗️ **NEW RESOURCES:**\n${createdResources.map((resource) => `${resource.fileName} - ${resource.url} (${resource.scrapeFrequency})`).join("\n")}`,
  });

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
        contextId, // TODO: Add this to the python API and check if it's a knowledge or context to create the resources and send the updates to the correct channel
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

// This function is used by the cron job to rescrape resources
// The Python service handles chunk management based on content changes
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
    (resource) =>
      resource.knowledge?.workflow.userId ?? resource.context?.workflow.userId
  );

  for (const userId in resourcesGroupedByUserId) {
    const resourcesByUser = resourcesGroupedByUserId[userId];

    console.log(
      `🐛 Checking ${resourcesByUser?.length ?? 0} resources for user ${userId}`
    );

    const { plan } = await getCustomerSubscriptionStatusForUserId(userId);

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
      if (await fileSizeExceedsPlanLimit(resource, plan)) {
        // TODO: Send email to user saying that they have reached the limit in this workflow
        console.log(
          `🐛 Skipping resource ${resource.id} because it exceeds the plan size limit (50MB for free users, 500MB for paid users)`
        );

        void sendDiscordNotification({
          content: `🐛 **RESCRAPE:**\nSkipping resource ${resource.id} because it exceeds the plan size limit (50MB for free users, 500MB for paid users). 🗣️ Talk to user: ${userId}`,
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

  // Update all lastScrapedAt timestamps in a single query to prevent duplicate processing
  const resourceIds = resourcesToRescrape.map((r) => r.id);
  const updateTimestamp = new Date();

  await db
    .update(resourcesTable)
    .set({
      lastScrapedAt: updateTimestamp,
    })
    .where(inArray(resourcesTable.id, resourceIds));

  for (const resource of resourcesToRescrape) {
    console.log(`🐛 Sending resource ${resource.id} to Python API`);

    const userId =
      resource.knowledge?.workflow.userId ?? resource.context?.workflow.userId;
    const workflowId =
      resource.knowledge?.workflow.id ?? resource.context?.workflow.id;

    const response = await fetch(
      `${env.PYTHON_KNOWLEDGE_API_URL}/api/v1/rescrape`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resources: [
            {
              type: resource.type,
              id: resource.id,
              url: resource.url,
              title: resource.title,
            },
          ],
          knowledgeId: resource.knowledge?.id,
          contextId: resource.context?.id,
          userId,
          workflowId,
          rescrapeSecret: env.RESCRAPE_CRON_SECRET,
        }),
      }
    );

    if (!response.ok) {
      console.log(
        `🐛 Failed to rescrape resource ${resource.id} (status: ${response.status})`
      );
      continue;
    }

    // The Python service will handle chunks appropriately:
    // - If content unchanged (cache hit), chunks remain untouched
    // - If content changed, old chunks are deleted and new ones created
    console.log(
      `🐛 Successfully initiated rescrape for resource ${resource.id}`
    );
  }

  console.log(
    `🐛 Successfully ✅ initiated rescrape for ${resourcesToRescrape.length} resources`
  );

  void sendDiscordNotification({
    content: `🐛 **RESCRAPE:**\nSuccessfully ✅ initiated rescrape for ${resourcesToRescrape.length} resources`,
  });
}

function lastScrapingDateIsNewerThanScrapeFrequency(
  lastScrapedAt: Date,
  scrapeFrequency: "HOURLY" | "DAILY" | "WEEKLY" | "NEVER"
) {
  const now = new Date();

  console.log(`🐛 now: ${now}`);
  console.log(`🐛 lastScrapedAt: ${lastScrapedAt}`);

  const buffer = (time: Date) => addMinutes(time, -1);
  let nextScrapeAt: Date = new Date();

  if (scrapeFrequency === "HOURLY") {
    nextScrapeAt = addHours(lastScrapedAt, 1);
  } else if (scrapeFrequency === "DAILY") {
    nextScrapeAt = addDays(lastScrapedAt, 1);
  } else if (scrapeFrequency === "WEEKLY") {
    nextScrapeAt = addDays(lastScrapedAt, 7);
  }

  console.log(`🐛 nextScrapeAt: ${nextScrapeAt}`);
  return isBefore(now, buffer(nextScrapeAt));
}

async function fileSizeExceedsPlanLimit(
  resource: ResourceWithKnowledgeAndWorkflow,
  plan: "hobby" | "basic" | "pro" | null
) {
  const maxKnowledgeSize =
    plan === "pro"
      ? 200 * 1024 * 1024 // 200MB
      : plan === "basic"
        ? 50 * 1024 * 1024 // 50MB
        : 5 * 1024 * 1024; // 5MB

  // Get all resources in the knowledge
  const otherResourcesSize = await db.query.resources.findMany({
    where: and(
      or(
        eq(resources.knowledgeId, resource.knowledge?.id ?? ""),
        eq(resources.contextId, resource.context?.id ?? "")
      ),
      eq(resources.active, true),
      not(eq(resources.id, resource.id))
    ),
    columns: {
      fileSize: true,
    },
  });

  // Get the current total size of the knowledge
  const currentKnowledgeAndContextsSizeInWorkflowWithoutCurrentResource =
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
    file.size +
      currentKnowledgeAndContextsSizeInWorkflowWithoutCurrentResource >
    maxKnowledgeSize
  ) {
    return true;
  }

  return false;
}

export async function rescrapeResource(resourceId: string) {
  const userResponse = await getUser();
  if (!userResponse.data.user) {
    throw new Error("Unauthorized");
  }
  const user = userResponse.data.user;

  // Get the resource with its knowledge and workflow
  const resource = await db.query.resources.findFirst({
    where: and(
      eq(resources.id, resourceId),
      eq(resources.type, "LINK"),
      eq(resources.active, true)
    ),
    with: {
      knowledge: {
        with: {
          workflow: true,
        },
      },
      context: {
        with: {
          workflow: true,
        },
      },
    },
  });

  if (!resource) {
    throw new Error("Resource not found");
  }

  // Check if user owns the workflow
  if (
    resource.knowledge?.workflow?.userId !== user.id &&
    resource.context?.workflow?.userId !== user.id
  ) {
    throw new Error("Unauthorized");
  }

  // Check if resource is a link
  if (resource.type !== "LINK") {
    throw new Error("Only links can be rescraped");
  }

  // For manual rescrapes, we don't want to set chunks to inactive
  // The Python service will handle this appropriately based on whether content changed
  console.log(`🐛 Manual rescrape initiated for resource ${resource.id}`);

  const userId =
    resource.knowledge?.workflow.userId ?? resource.context?.workflow.userId;
  const workflowId =
    resource.knowledge?.workflow.id ?? resource.context?.workflow.id;

  const response = await fetch(
    `${env.PYTHON_KNOWLEDGE_API_URL}/api/v1/rescrape`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resources: [
          {
            type: resource.type,
            id: resource.id,
            url: resource.url,
            title: resource.title,
          },
        ],
        knowledgeId: resource.knowledge?.id,
        contextId: resource.context?.id,
        userId,
        workflowId,
        rescrapeSecret: env.RESCRAPE_CRON_SECRET,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to initiate rescrape");
  }

  revalidatePath(
    `/dashboard/workflows/${workflowId}/` +
      (resource.knowledge ? "knowledge" : `contexts/${resource.context?.id}`)
  );

  return {
    success: true,
    message: "Resource rescrape initiated",
  };
}

export async function deleteResource(resourceId: string) {
  // delete the resource
  await db
    .update(resources)
    .set({ active: false })
    .where(eq(resources.id, resourceId));

  // delete the chunks
  await db
    .update(chunks)
    .set({ active: false })
    .where(eq(chunks.resourceId, resourceId));
}
