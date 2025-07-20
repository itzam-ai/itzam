"use server";

import { setupRunGeneration } from "@itzam/hono/utils";
import { generateTextOrObjectStream } from "@itzam/server/ai/generate/text";
import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";

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
  const {
    error,
    aiParams,
    run,
    workflow: workflowWithModel,
  } = await setupRunGeneration({
    userId: workflow.userId,
    workflowSlug: workflow.slug,
    threadId: options.threadId || null,
    input,
    attachments: undefined,
    contextSlugs: options.contextSlugs || [],
    origin: "WEB",
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
    mockSSE as Parameters<typeof generateTextOrObjectStream>[4],
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
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  return {
    stream: streamGenerator(),
    metadata: metadataPromise,
  };
}
