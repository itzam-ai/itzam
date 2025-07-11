"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { v7 } from "uuid";
import { getUser } from "../auth/actions";
import { db } from "../index";
import { getRunsByThreadIdWithResourcesAndAttachments } from "../run/actions";
import {
  contexts,
  threadContexts,
  threadLookupKeys,
  threads,
  workflows,
} from "../schema";

export async function getThreadByIdAndUserIdWithContexts(
  threadId: string,
  userId: string
) {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      workflow: {
        with: {
          model: true,
          modelSettings: true,
        },
      },
      threadContexts: {
        with: {
          context: true,
        },
      },
    },
  });

  if (!thread || thread.workflow.userId !== userId) {
    return {
      error: "Thread not found",
      status: 404,
    };
  }

  return thread;
}

export async function getThreadsByWorkflowSlug(
  workflowSlug: string,
  userId: string,
  options?: { lookupKeys?: string[] }
) {
  // First find the workflow by slug and userId
  const workflow = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.slug, workflowSlug),
      eq(workflows.userId, userId),
      eq(workflows.isActive, true)
    ),
  });

  if (!workflow) {
    return [];
  }

  // If no lookup keys are provided, return all threads for the workflow
  if (
    !options?.lookupKeys ||
    options.lookupKeys === undefined ||
    options.lookupKeys.length === 0
  ) {
    return await db.query.threads.findMany({
      where: eq(threads.workflowId, workflow.id),
      with: {
        lookupKeys: true,
        threadContexts: {
          with: {
            context: {
              columns: {
                slug: true,
              },
            },
          },
        },
      },
      orderBy: (threads, { desc }) => [desc(threads.updatedAt)],
    });
  }

  // Find threads that have ALL the specified lookup keysAdd commentMore actions
  // First, get thread IDs that have all the lookup keys
  const threadIdsWithAllKeys = await db
    .select({
      threadId: threadLookupKeys.threadId,
      keyCount: sql<number>`count(*)`.as("keyCount"),
    })
    .from(threadLookupKeys)
    .innerJoin(threads, eq(threadLookupKeys.threadId, threads.id))
    .where(
      and(
        eq(threads.workflowId, workflow.id),
        inArray(threadLookupKeys.lookupKey, options.lookupKeys)
      )
    )
    .groupBy(threadLookupKeys.threadId)
    .having(sql`count(*) = ${options.lookupKeys.length}`);

  if (threadIdsWithAllKeys.length === 0) {
    return [];
  }

  // Get the actual thread records
  const threadIds = threadIdsWithAllKeys.map((item) => item.threadId);

  const threadsFound = await db.query.threads.findMany({
    where: inArray(threads.id, threadIds),
    with: {
      lookupKeys: true,
      threadContexts: {
        with: {
          context: {
            columns: {
              slug: true,
            },
          },
        },
      },
    },
    orderBy: (threads, { desc }) => [desc(threads.updatedAt)],
  });

  return threadsFound;
}

export async function getThreadById(threadId: string, userId: string) {
  // Get thread and verify it belongs to the user
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      workflow: true,
      lookupKeys: true,
      threadContexts: {
        with: {
          context: {
            columns: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!thread || !thread.workflow || thread.workflow.userId !== userId) {
    return null;
  }

  return {
    id: thread.id,
    name: thread.name,
    lookupKeys: thread.lookupKeys.map((key) => key.lookupKey),
    contextSlugs: thread.threadContexts.map((context) => context.context.slug),
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

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
      lookupKeys: true,
    },
  });

  if (!thread || !thread.workflow || thread.workflow.userId !== currentUserId) {
    return [];
  }

  // Get runs for this thread
  return await getRunsByThreadIdWithResourcesAndAttachments(threadId);
}

export async function createThread({
  workflowId,
  lookupKeys,
  name,
  contextSlugs,
}: {
  workflowId: string;
  lookupKeys: string[] | undefined;
  name: string | undefined;
  contextSlugs: string[] | undefined;
}) {
  const threadId = `thread_${v7()}`;
  const threadName = name || `Thread ${threadId.slice(-10)}`;

  // Contexts to be linked to the thread
  let contextIds: string[] = [];

  if (contextSlugs) {
    contextIds = await db.query.contexts
      .findMany({
        where: and(
          inArray(contexts.slug, contextSlugs),
          eq(contexts.isActive, true),
          eq(contexts.workflowId, workflowId)
        ),
        columns: {
          id: true,
          slug: true,
        },
      })
      .then((res) => res.map((r) => r.id));

    if (contextIds.length !== contextSlugs.length) {
      return {
        error: "Context slugs not found",
        status: 404,
        possibleValues: contextSlugs,
      };
    }
  }

  const [thread] = await db
    .insert(threads)
    .values({
      id: threadId,
      name: threadName,
      workflowId,
    })
    .returning();

  if (!thread) {
    return {
      error: "Failed to create thread",
      status: 500,
    };
  }

  if (lookupKeys && lookupKeys.length > 0) {
    await db.insert(threadLookupKeys).values(
      lookupKeys.map((key) => ({
        id: `thread_lookup_key_${v7()}`,
        threadId: thread.id,
        lookupKey: key,
      }))
    );
  }

  if (contextIds.length > 0) {
    await db.insert(threadContexts).values(
      contextIds.map((contextId) => ({
        id: `thread_context_${v7()}`,
        threadId: thread.id,
        contextId,
      }))
    );
  }

  return {
    ...thread,
    lookupKeys: lookupKeys || [],
    contextSlugs: contextSlugs || [],
  };
}
