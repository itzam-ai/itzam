"use server";

import { revalidatePath } from "next/cache";
import "server-only";
import { v7 } from "uuid";
import { db } from "..";
import { createEmbeddings } from "../../ai/embeddings";
import { chunks, knowledge, resources, workflows } from "../schema";
import { getUser } from "../auth/actions";
import { eq, inArray } from "drizzle-orm";
type ResourceInput = {
  url: string;
  type: "FILE" | "LINK";
  mimeType: string;
  fileName: string;
  fileSize: number;
};

export type Knowledge = Awaited<ReturnType<typeof getKnowledgeByWorkflowId>>;

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
      },
    },
  });

  return knowledgeFromWorkflow;
}

export type Resource = typeof resources.$inferSelect;

export async function createResources(
  resourcesInput: ResourceInput[],
  knowledgeId: string,
  workflowId: string
) {
  const { data: user, error } = await getUser();

  if (error) {
    throw new Error(error.message);
  }

  const resourcesCreated = await db
    .insert(resources)
    .values(
      resourcesInput.map((resource) => ({
        ...resource,
        id: v7(),
        knowledgeId,
      }))
    )
    .returning();

  resourcesCreated.forEach((resource) => {
    void createEmbeddings(resource, workflowId);
  });

  revalidatePath(`/workflows/${workflowId}/knowledge`);
  return resourcesCreated;
}

export async function deleteResource(resourceId: string, workflowId: string) {
  await db
    .update(resources)
    .set({ active: false })
    .where(eq(resources.id, resourceId));

  const chunksToDelete = await db.query.chunks.findMany({
    where: eq(chunks.resourceId, resourceId),
  });

  await db
    .update(chunks)
    .set({ active: false })
    .where(
      inArray(
        chunks.id,
        chunksToDelete.map((chunk) => chunk.id)
      )
    );

  revalidatePath(`/workflows/${workflowId}/knowledge`);
}
