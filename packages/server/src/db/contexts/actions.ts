"use server";

import { and, desc, eq } from "drizzle-orm";
import "server-only";
import { db } from "..";
import { getUser } from "../auth/actions";
import { customerIsSubscribedToItzamPro } from "../billing/actions";
import { chunks, contexts, resources, workflows } from "../schema";

export type Contexts = NonNullable<
  Awaited<ReturnType<typeof getContextsByWorkflowId>>
>;

export async function getContextsByWorkflowId(workflowId: string) {
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const contextsFromWorkflow = await db.query.contexts.findMany({
    where: eq(contexts.workflowId, workflowId),
    with: {
      threadContexts: {
        with: {
          thread: true,
        },
      },
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

  return contextsFromWorkflow;
}
