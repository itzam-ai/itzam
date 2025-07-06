"use server";

import Itzam from "itzam";
import { env } from "@itzam/utils";
import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";
import { createStreamableValue } from "ai/rsc";
import { generateTextOrObjectStream } from "@itzam/server/ai/generate/text";
import { setupRunGeneration } from "@itzam/hono/utils";

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

type StreamMetadata = {
  runId: string;
  model: {
    name: string;
    tag: string;
  };
  inputTokens: number;
  outputTokens: number;
  durationInMs: number;
  cost: string;
};

export async function sendMessage(
  input: string,
  options: {
    workflowId: string;
    contextSlugs?: string[];
    threadId?: string | null;
    prompt?: string;
    modelId?: string;
  }
) {
  // Get workflow to get the slug
  const workflow = await getWorkflowByIdWithRelations(options.workflowId);
  
  if (!workflow || "error" in workflow) {
    throw new Error("Workflow not found");
  }

  // Setup run generation using the same logic as the API
  const { error, status, aiParams, run, workflow: workflowWithModel } = await setupRunGeneration({
    userId: workflow.userId,
    workflowSlug: workflow.slug,
    threadId: options.threadId || null,
    input,
    attachments: undefined,
    contextSlugs: options.contextSlugs || [],
  });

  if (error || !aiParams || !run || !workflowWithModel) {
    throw new Error(error || "Failed to setup run generation");
  }

  const startTime = Date.now();
  
  // Create a custom stream that mimics the SDK's response
  let metadataResolve: (value: StreamMetadata) => void;
  const metadataPromise = new Promise<StreamMetadata>((resolve) => {
    metadataResolve = resolve;
  });

  // Create a custom SSE handler to capture events
  const chunks: string[] = [];
  let isComplete = false;
  
  const mockSSE = {
    writeSSE: async ({ data, event }: { data: string; event: string }) => {
      const parsedData = JSON.parse(data);
      
      if (event === "text-delta") {
        chunks.push(parsedData.textDelta);
      } else if (event === "finish") {
        metadataResolve(parsedData.metadata);
        isComplete = true;
      } else if (event === "error") {
        throw new Error(parsedData.error || "Stream error");
      }
    },
    close: async () => {
      isComplete = true;
    },
  };

  // Start the generation in the background
  generateTextOrObjectStream(
    aiParams,
    run,
    workflowWithModel.model,
    startTime,
    mockSSE as any,
    "text"
  ).catch((error) => {
    console.error("Stream error:", error);
    isComplete = true;
  });

  // Create an async generator that yields chunks as they come
  async function* streamGenerator() {
    let lastIndex = 0;
    
    while (!isComplete || lastIndex < chunks.length) {
      if (lastIndex < chunks.length) {
        yield chunks[lastIndex++];
      } else {
        // Wait a bit for more chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  return {
    stream: streamGenerator(),
    metadata: metadataPromise,
  };
}