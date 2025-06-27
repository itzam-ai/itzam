"use server";

import { and, desc, eq } from "drizzle-orm";
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

export async function checkPlanLimits(workflowId: string) {
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

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();

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

  const totalSize = totalKnowledgeResourcesSize + totalContextsResourcesSize;

  // check if the user has reached the limit in this workflow (50MB or 500MB)
  const maxSize = isSubscribedToItzamPro.isSubscribed
    ? 500 * 1024 * 1024
    : 50 * 1024 * 1024;

  if (totalSize > maxSize) {
    throw new Error(
      `Your plan has a limit of ${maxSize / 1024 / 1024}MB. You have ${totalSize / 1024 / 1024}MB in your workflow.`
    );
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
