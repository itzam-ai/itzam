"use server";

import { getUser } from "@itzam/server/db/auth/actions";
import { createThread as createThreadDb } from "@itzam/server/db/thread/actions";
import { workflows } from "@itzam/server/db/schema";
import { db } from "@itzam/server/db/index";
import { and, eq } from "drizzle-orm";

export async function createThread({
  workflowSlug,
  name,
  lookupKeys = [],
  contextSlugs = [],
}: {
  workflowSlug: string;
  name: string;
  lookupKeys?: string[];
  contextSlugs?: string[];
}) {
  try {
    const user = await getUser();

    if (user.error || !user.data.user) {
      throw new Error("User not found");
    }

    const userId = user.data.user.id;

    if (!workflowSlug) {
      throw new Error("workflowSlug is required");
    }

    // Find the workflow by slug and userId
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.slug, workflowSlug),
        eq(workflows.userId, userId),
        eq(workflows.isActive, true),
      ),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const thread = await createThreadDb({
      workflowId: workflow.id,
      lookupKeys,
      name,
      contextSlugs,
    });

    if ("error" in thread) {
      throw new Error(thread.error);
    }

    return {
      id: thread.id,
      name: thread.name,
      lookupKeys: thread.lookupKeys,
      contextSlugs: thread.contextSlugs,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error instanceof Error ? error : new Error("Unknown error");
  }
}
