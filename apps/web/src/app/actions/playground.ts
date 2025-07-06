"use server";

import Itzam from "itzam";
import { env } from "@itzam/utils";
import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";
import { createStreamableValue } from "ai/rsc";

const itzam = new Itzam(env.ITZAM_API_KEY);

export async function streamPlaygroundContent({
  input,
  prompt, // eslint-disable-line @typescript-eslint/no-unused-vars
  modelId, // eslint-disable-line @typescript-eslint/no-unused-vars
  workflowId,
  contextSlugs,
  threadId,
}: {
  input: string;
  prompt: string; // Not used by SDK - workflow's prompt is used
  modelId: string; // Not used by SDK - workflow's model is used
  workflowId: string;
  contextSlugs: string[];
  threadId: string | null;
}) {
  // Get workflow to get the slug
  const workflow = await getWorkflowByIdWithRelations(workflowId);
  
  if (!workflow || "error" in workflow) {
    throw new Error("Workflow not found");
  }

  // Note: The SDK uses the workflow's configured model, not a custom modelId
  // To override the model, you would need to update the workflow's model first
  const { stream, metadata: metadataPromise } = await itzam.streamText({
    input,
    workflowSlug: workflow.slug,
    contextSlugs,
    threadId: threadId || undefined,
  });

  // Create streamable values for content and metadata
  const content = createStreamableValue("");
  const metadata = createStreamableValue<{
    runId: string;
    model: {
      name: string;
      tag: string;
    };
    inputTokens: number;
    outputTokens: number;
    durationInMs: number;
    cost: string;
  } | null>(null);

  // Stream content
  (async () => {
    try {
      for await (const chunk of stream) {
        content.update(chunk);
      }
      content.done();
    } catch (error) {
      console.error("Error streaming content:", error);
      content.error(error instanceof Error ? error : new Error("Streaming error"));
    }
  })();

  // Handle metadata
  (async () => {
    try {
      const meta = await metadataPromise;
      metadata.update(meta);
      metadata.done();
    } catch (error) {
      console.error("Error getting metadata:", error);
      metadata.done();
    }
  })();

  return {
    content: content.value,
    metadata: metadata.value,
  };
}