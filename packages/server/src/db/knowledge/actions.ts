"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import "server-only";
import { db } from "..";
import { getUser } from "../auth/actions";
import { chunks, knowledge, resources, workflows } from "../schema";
import { createClient } from "../supabase/server";

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

export type Resource = typeof resources.$inferSelect;

type ResourceInput = {
  url: string;
  type: "FILE" | "LINK";
  mimeType: string;
  fileName: string;
  fileSize: number;
  id?: string;
};

export async function createResources(
  resourcesInput: ResourceInput[],
  knowledgeId: string,
  workflowId: string
) {
  const { data: user, error } = await getUser();

  if (error) {
    throw new Error(error.message);
  }

  // Call the edge function to create resources and embeddings
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No session found");
  }

  const response = await fetch(
    `${process.env.SUPABASE_URL}/functions/v1/create-knowledge-resource`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        resources: resourcesInput,
        knowledgeId,
        workflowId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create resources: ${response.statusText}`);
  }

  const result = await response.json();
  return result.resources;
}

export async function deleteResource(resourceId: string) {
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
}
