"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "../index";
import { getRunsByThreadId } from "../run/actions";
import { threads, threadContexts, workflows } from "../schema";
import { getUser } from "../auth/actions";

export async function getThreadsByWorkflowSlug(
  workflowSlug: string,
  userId: string,
  options?: { lookupKey?: string }
) {
  // First find the workflow by slug and userId
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.slug, workflowSlug),
  });

  if (!workflow || workflow.userId !== userId) {
    return [];
  }

  // Build where conditions
  const whereConditions = [eq(threads.workflowId, workflow.id)];

  if (options?.lookupKey) {
    whereConditions.push(eq(threads.lookupKey, options.lookupKey));
  }

  // Get threads for this workflow with their contexts
  return await db.query.threads.findMany({
    where: and(...whereConditions),
    orderBy: (threads, { desc }) => [desc(threads.updatedAt)],
    with: {
      threadContexts: {
        with: {
          context: {
            with: {
              resourceContexts: {
                with: {
                  resource: {
                    columns: {
                      id: true,
                      title: true,
                      type: true,
                      url: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getThreadById(threadId: string, userId: string) {
  // Get thread and verify it belongs to the user
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      workflow: true,
      threadContexts: {
        with: {
          context: {
            with: {
              resourceContexts: {
                with: {
                  resource: {
                    columns: {
                      id: true,
                      title: true,
                      type: true,
                      url: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!thread || !thread.workflow || thread.workflow.userId !== userId) {
    return null;
  }

  // Transform contexts data
  const contexts = thread.threadContexts?.map((tc) => ({
    ...tc.context,
    createdAt: tc.context.createdAt.toISOString(),
    updatedAt: tc.context.updatedAt.toISOString(),
    resources: tc.context.resourceContexts?.map((rc) => rc.resource) || [],
    resourceContexts: undefined,
  })) || [];

  return {
    id: thread.id,
    name: thread.name,
    lookupKey: thread.lookupKey,
    contexts,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

export type ThreadRunsHistory = Awaited<
  ReturnType<typeof getThreadRunsHistory>
>;

export async function getThreadRunsHistory(threadId: string, userId?: string) {
  let currentUserId = userId;

  if (!userId) {
    const { data, error } = await getUser();

    if (error) {
      return [];
    }

    currentUserId = data?.user?.id || "";
  }

  // First verify the thread belongs to the user
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      workflow: true,
    },
  });

  if (!thread || !thread.workflow || thread.workflow.userId !== currentUserId) {
    return [];
  }

  // Get runs for this thread
  return await getRunsByThreadId(threadId);
}

export async function getThreadContextIds(threadId: string): Promise<string[]> {
  const threadContextRelations = await db.query.threadContexts.findMany({
    where: eq(threadContexts.threadId, threadId),
    columns: {
      contextId: true,
    },
  });

  return threadContextRelations.map(tc => tc.contextId);
}
