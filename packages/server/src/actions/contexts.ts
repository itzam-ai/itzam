"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "../db";
import { contexts, resourceContexts } from "../db/schema";
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

    // Update each context
    for (const context of allContexts) {
      const shouldHaveResource = contextIds.includes(context.id);
      const hasResource = context.resourceContexts?.some((rc) => rc.resourceId === resourceId);

      if (shouldHaveResource && !hasResource) {
        // Add resource to context
        await db.insert(resourceContexts).values({
          id: uuidv7(),
          contextId: context.id,
          resourceId,
        });
      } else if (!shouldHaveResource && hasResource) {
        // Remove resource from context
        await db.delete(resourceContexts)
          .where(
            and(
              eq(resourceContexts.contextId, context.id),
              eq(resourceContexts.resourceId, resourceId)
            )
          );
      }
    }

    revalidatePath(`/dashboard/workflows/${workflowId}/knowledge`);
    return { success: true };
  } catch (error) {
    console.error("Error updating resource contexts:", error);
    throw error;
  }
}