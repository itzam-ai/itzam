"use server";

import { and, desc, eq } from "drizzle-orm";
import "server-only";
import { db } from "..";
import { getUser } from "../auth/actions";
import { getCustomerSubscriptionStatus } from "../billing/actions";
import { chunks, knowledge, resources, workflows } from "../schema";

export type Knowledge = NonNullable<
  Awaited<ReturnType<typeof getKnowledgeByWorkflowId>>
>;

export async function getKnowledgeByWorkflowId(workflowId: string) {
  const workflow = await db.query.workflows.findFirst({
    columns: {
      knowledgeId: true,
    },
    where: eq(workflows.id, workflowId),
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const knowledgeFromWorkflow = await db.query.knowledge.findFirst({
    where: eq(knowledge.id, workflow.knowledgeId),
    with: {
      resources: {
        where: eq(resources.active, true),
        orderBy: desc(resources.createdAt),
        with: {
          chunks: {
            where: and(eq(chunks.active, true)),
            columns: {
              id: true,
              resourceId: true,
              active: true,
            },
          },
        },
      },
    },
  });

  return knowledgeFromWorkflow;
}

export async function checkPlanLimits(
  workflowId: string,
  resourcesUploaded: Knowledge["resources"]
) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
    with: {
      knowledge: {
        with: {
          resources: {
            where: eq(resources.active, true),
            columns: {
              fileSize: true,
            },
          },
        },
      },
      contexts: {
        with: {
          resources: {
            where: eq(resources.active, true),
            columns: {
              fileSize: true,
            },
          },
        },
      },
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // check if resources are FILE or LINK
  // if FILE, sum up the total size of the files
  // if LINK, fetch each link and sum up the total size of the files
  const totalResourcesSize = (
    await Promise.all(
      resourcesUploaded.map(async (resource) => {
        if (resource.type === "FILE") {
          return resource.fileSize ?? 0;
        } else if (resource.type === "LINK") {
          const fileResponse = await fetch(resource.url);

          if (!fileResponse.ok) {
            throw new Error("Could not fetch file");
          }

          const arrayBuffer = await fileResponse.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          const type =
            fileResponse.headers.get("content-type") || resource.mimeType;

          if (!type) {
            throw new Error("Could not determine mime type");
          }

          const file = new File([buffer], resource.fileName || "file", {
            type,
          });

          return file.size;
        }
        return 0;
      })
    )
  ).reduce((acc, size) => acc + size, 0);

  const { plan } = await getCustomerSubscriptionStatus();

  const totalKnowledgeResourcesSize = workflow.knowledge?.resources.reduce(
    (acc, resource) => acc + (resource.fileSize ?? 0),
    0
  );

  const totalContextsResourcesSize = workflow.contexts?.reduce(
    (acc, context) =>
      acc +
      (context.resources.reduce(
        (acc, resource) => acc + (resource.fileSize ?? 0),
        0
      ) ?? 0),
    0
  );

  const currentKnowledgeAndContextsSize =
    totalKnowledgeResourcesSize + totalContextsResourcesSize;

  const totalSizeWithNewResources =
    currentKnowledgeAndContextsSize + totalResourcesSize;

  // check if the user has reached the limit in this workflow (5MB, 50MB or 200MB)
  const maxSize =
    plan === "pro"
      ? 200 * 1024 * 1024 // 200MB
      : plan === "basic"
        ? 50 * 1024 * 1024 // 50MB
        : 5 * 1024 * 1024; // 5MB

  if (totalSizeWithNewResources > maxSize) {
    const totalSizeWithNewResourcesInMB =
      totalSizeWithNewResources / 1024 / 1024;

    throw new Error(
      `Your plan has a limit of ${maxSize / 1024 / 1024}MB. The resources uploaded would sum up to ${totalSizeWithNewResourcesInMB.toFixed(
        2
      )}MB.`
    );
  }
}

export async function getMaxLimit() {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const { plan } = await getCustomerSubscriptionStatus();

  const maxSize =
    plan === "pro"
      ? 200 * 1024 * 1024 // 200MB
      : plan === "basic"
        ? 50 * 1024 * 1024 // 50MB
        : 5 * 1024 * 1024; // 5MB

  return maxSize;
}
