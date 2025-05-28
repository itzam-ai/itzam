import { configure, runs, tasks } from "@trigger.dev/sdk/v3";

// Configure the SDK with the secret key
configure({
  secretKey: process.env.TRIGGER_SECRET_KEY,
});

export interface ChunkAndEmbedPayload {
  resources: Array<{
    url: string;
    type: "FILE" | "LINK";
    mimeType: string;
    fileName: string;
    fileSize: number;
    id?: string;
  }>;
  knowledgeId: string;
  workflowId: string;
  userId: string;
}

export const triggerChunkAndEmbed = async (payload: ChunkAndEmbedPayload) => {
  try {
    const handle = await tasks.trigger("chunk-and-embed", payload);

    return {
      success: true,
      handle: handle.id,
      publicAccessToken: handle.publicAccessToken,
    };
  } catch (error) {
    console.error("Failed to trigger chunk and embed task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getTaskStatus = async (taskId: string) => {
  try {
    const run = await runs.retrieve(taskId);
    return {
      success: true,
      status: run.status,
      output: run.output,
      error: run.error,
    };
  } catch (error) {
    console.error("Failed to get task status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
