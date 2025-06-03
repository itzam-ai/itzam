"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
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

export async function checkPlanLimits(knowledgeId: string) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();

  const resourcesSize = await db.query.resources.findMany({
    where: and(
      eq(resources.knowledgeId, knowledgeId),

      eq(resources.active, true)
    ),
    columns: {
      fileSize: true,
    },
  });

  const totalSize = resourcesSize.reduce(
    (acc, resource) => acc + (resource.fileSize ?? 0),
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
