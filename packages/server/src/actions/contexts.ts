"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "../db";
import { contexts, resourceContexts, resources, workflows } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

export async function getContexts(workflowSlug: string) {
  try {
    const workflowContexts = await db.query.contexts.findMany({
      where: sql`workflow_id IN (SELECT id FROM workflow WHERE slug = ${workflowSlug})`,
      with: {
        resourceContexts: {
          with: {
            resource: true,
          },
        },
      },
    });

    return { data: workflowContexts };
  } catch (error) {
    console.error("Error fetching contexts:", error);
    throw error;
  }
}

export async function getContext(identifier: string) {
  try {
    const context = await db.query.contexts.findFirst({
      where: sql`${contexts.id} = ${identifier} OR ${contexts.slug} = ${identifier}`,
      with: {
        resourceContexts: {
          with: {
            resource: true,
          },
        },
      },
    });

    return { data: context };
  } catch (error) {
    console.error("Error fetching context:", error);
    throw error;
  }
}

export async function createContext(input: {
  name: string;
  slug: string;
  description?: string;
  workflowId: string;
  resourceIds?: string[];
}) {
  try {
    const contextId = uuidv7();
    
    const result = await db.insert(contexts).values({
      id: contextId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      workflowId: input.workflowId,
    }).returning();

    const context = result[0];
    if (!context) {
      throw new Error("Failed to create context");
    }

    if (input.resourceIds && input.resourceIds.length > 0) {
      await db.insert(resourceContexts).values(
        input.resourceIds.map(resourceId => ({
          id: uuidv7(),
          contextId: context.id,
          resourceId,
        }))
      );
    }

    revalidatePath(`/dashboard/workflows/${input.workflowId}/knowledge`);
    return context;
  } catch (error) {
    console.error("Error creating context:", error);
    throw error;
  }
}

export async function updateContext(
  id: string,
  input: {
    name?: string;
    description?: string;
    resources?: {
      add?: Array<{ id?: string; url?: string; content?: string; type: "TEXT" | "IMAGE" | "FILE" | "URL" }>;
      remove?: string[];
    };
  }
) {
  try {
    if (input.name || input.description) {
      await db.update(contexts)
        .set({
          name: input.name,
          description: input.description,
        })
        .where(eq(contexts.id, id));
    }

    if (input.resources?.remove && input.resources.remove.length > 0) {
      await db.delete(resourceContexts)
        .where(
          and(
            eq(resourceContexts.contextId, id),
            sql`${resourceContexts.resourceId} IN ${input.resources.remove}`
          )
        );
    }

    if (input.resources?.add && input.resources.add.length > 0) {
      const resourcesToAdd = input.resources.add
        .filter(r => r.id)
        .map(r => ({
          id: uuidv7(),
          contextId: id,
          resourceId: r.id!,
        }));
      
      if (resourcesToAdd.length > 0) {
        await db.insert(resourceContexts).values(resourcesToAdd);
      }
    }

    revalidateTag("contexts");
    revalidatePath("/dashboard/workflows");
    return { success: true };
  } catch (error) {
    console.error("Error updating context:", error);
    throw error;
  }
}

export async function addResourceToContexts(
  resourceId: string,
  contextIds: string[],
  workflowId: string
) {
  try {
    // Get all contexts for the workflow
    const allContexts = await db.query.contexts.findMany({
      where: eq(contexts.workflowId, workflowId),
      with: {
        resourceContexts: true,
      },
    });

    const isAddingToAnyContext = contextIds.length > 0;

    // If adding to any context, remove from knowledge
    if (isAddingToAnyContext) {
      await db.update(resources)
        .set({ knowledgeId: null })
        .where(eq(resources.id, resourceId));
    }

    // Prepare batch operations
    const contextsToAdd: string[] = [];
    const contextsToRemove: string[] = [];

    for (const context of allContexts) {
      const shouldHaveResource = contextIds.includes(context.id);
      const hasResource = context.resourceContexts?.some((rc) => rc.resourceId === resourceId);

      if (shouldHaveResource && !hasResource) {
        contextsToAdd.push(context.id);
      } else if (!shouldHaveResource && hasResource) {
        contextsToRemove.push(context.id);
      }
    }

    // Batch insert new associations
    if (contextsToAdd.length > 0) {
      const associations = contextsToAdd.map(contextId => ({
        id: uuidv7(),
        contextId,
        resourceId,
      }));
      await db.insert(resourceContexts).values(associations);
    }

    // Batch delete removed associations
    if (contextsToRemove.length > 0) {
      await db.delete(resourceContexts)
        .where(
          and(
            sql`${resourceContexts.contextId} IN ${contextsToRemove}`,
            eq(resourceContexts.resourceId, resourceId)
          )
        );
    }

    // If removing from all contexts, add back to knowledge
    if (!isAddingToAnyContext) {
      // Get the workflow's knowledge ID
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
        columns: { knowledgeId: true },
      });
      
      if (workflow) {
        await db.update(resources)
          .set({ knowledgeId: workflow.knowledgeId })
          .where(eq(resources.id, resourceId));
      }
    }

    revalidatePath(`/dashboard/workflows/${workflowId}/knowledge`);
    revalidatePath(`/dashboard/workflows/${workflowId}/context`);
    return { success: true };
  } catch (error) {
    console.error("Error updating resource contexts:", error);
    throw error;
  }
}