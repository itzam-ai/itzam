"use server";

import { and, desc, eq } from "drizzle-orm";
import "server-only";
import { v7 } from "uuid";
import { db } from "..";
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
    where: and(
      eq(contexts.workflowId, workflowId),
      eq(contexts.isActive, true)
    ),
    with: {
      threadContexts: {
        with: {
          thread: true,
        },
      },
      resources: {
        where: eq(resources.active, true),
        orderBy: desc(resources.createdAt),
        columns: {
          id: true,
          type: true,
          title: true,
          url: true,
          fileSize: true,
        },
      },
    },
    orderBy: desc(contexts.createdAt),
  });

  return contextsFromWorkflow;
}

export async function getContextById(contextId: string) {
  const context = await db.query.contexts.findFirst({
    where: eq(contexts.id, contextId),
    with: {
      resources: {
        where: eq(resources.active, true),
        orderBy: desc(resources.createdAt),
        with: {
          chunks: {
            where: eq(chunks.active, true),
            orderBy: desc(chunks.createdAt),
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

  if (!context) {
    throw new Error("Context not found");
  }

  return context;
}

export async function createContext(
  workflowId: string,
  name: string,
  slug: string,
  description?: string
) {
  const contextWithSameSlug = await db.query.contexts.findFirst({
    where: and(
      eq(contexts.slug, slug),
      eq(contexts.workflowId, workflowId),
      eq(contexts.isActive, true)
    ),
  });

  if (contextWithSameSlug) {
    throw new Error("Context with same slug already exists");
  }

  const [context] = await db
    .insert(contexts)
    .values({
      id: v7(),
      workflowId,
      name,
      description,
      slug,
    })
    .returning();

  return context;
}

export async function deleteContext(contextId: string) {
  const context = await db.query.contexts.findFirst({
    where: eq(contexts.id, contextId),
  });

  if (!context) {
    throw new Error("Context not found");
  }

  const contextResources = await db.query.resources.findMany({
    where: and(eq(resources.contextId, contextId), eq(resources.active, true)),
  });

  // delete all resources in the context
  for (const resource of contextResources) {
    await db
      .update(resources)
      .set({ active: false })
      .where(eq(resources.id, resource.id));
  }

  // delete the context
  await db
    .update(contexts)
    .set({ isActive: false })
    .where(eq(contexts.id, contextId));
}
