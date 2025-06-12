"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import "server-only";
import { db } from "..";
import { getUser } from "../auth/actions";
import { customerIsSubscribedToItzamPro } from "../billing/actions";
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
        where: and(
          eq(resources.active, true),
          eq(resources.knowledgeId, workflow.knowledgeId)
        ),
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

export async function checkPlanLimits(workflowId: string) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();

  // Get the workflow's knowledge to check limits
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
    columns: {
      knowledgeId: true,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // check if the user has reached the limit in this workflow (50MB)
  // Get all resources in the workflow (both knowledge and context resources)
  const knowledgeResources = await db.query.resources.findMany({
    where: and(
      eq(resources.knowledgeId, workflow.knowledgeId),
      eq(resources.active, true)
    ),
    columns: {
      fileSize: true,
    },
  });

  // Get all context resources for this workflow
  const contextResources = await db.query.resourceContexts.findMany({
    where: sql`context_id IN (SELECT id FROM context WHERE workflow_id = ${workflowId})`,
    with: {
      resource: {
        columns: {
          fileSize: true,
          active: true,
        },
      },
    },
  });

  // Filter active context resources and extract their sizes
  const activeContextResourceSizes = contextResources
    .filter(rc => rc.resource.active)
    .map(rc => rc.resource.fileSize || 0);

  // Combine all resource sizes
  const allResourceSizes = [
    ...knowledgeResources.map(r => r.fileSize || 0),
    ...activeContextResourceSizes,
  ];

  const totalSize = allResourceSizes.reduce(
    (acc, size) => acc + size,
    0
  );

  // check if the user has reached the limit in this workflow (50MB or 500MB)
  const maxSize = isSubscribedToItzamPro.isSubscribed
    ? 500 * 1024 * 1024
    : 50 * 1024 * 1024;

  if (totalSize > maxSize) {
    throw new Error(`Your plan has a limit of ${maxSize / 1024 / 1024}MB.`);
  }
}

export async function getMaxLimit() {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();

  const maxSize = isSubscribedToItzamPro.isSubscribed
    ? 500 * 1024 * 1024
    : 50 * 1024 * 1024;

  return maxSize;
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
