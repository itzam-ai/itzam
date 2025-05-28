import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { getRunsByThreadId } from "../run/actions";
import { threads, workflows } from "../schema";

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

  // Get threads for this workflow
  return await db.query.threads.findMany({
    where: and(...whereConditions),
    orderBy: (threads, { desc }) => [desc(threads.updatedAt)],
  });
}

export async function getThreadById(threadId: string, userId: string) {
  // Get thread and verify it belongs to the user
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      workflow: true,
    },
  });

  if (!thread || !thread.workflow || thread.workflow.userId !== userId) {
    return null;
  }

  return {
    id: thread.id,
    name: thread.name,
    lookupKey: thread.lookupKey,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
}

export async function getThreadRunsHistory(threadId: string, userId: string) {
  // First verify the thread belongs to the user
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      workflow: true,
    },
  });

  if (!thread || !thread.workflow || thread.workflow.userId !== userId) {
    return [];
  }

  // Get runs for this thread
  return await getRunsByThreadId(threadId);
}
