import { env } from "@itzam/utils/env";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../functions/_shared/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const supabase = createClient();

// Type for resource updates
export type ResourceUpdatePayload = {
  resourceId: string;
  status?: "FAILED" | "PENDING" | "PROCESSED";
  title?: string;
  fileSize?: number;
  processedChunks?: number;
  totalChunks?: number;
  knowledgeId?: string;
  [key: string]: any;
};

export const subscribeToChannel = (
  channelId: string,
  onUpdate: (payload: any) => void
) => {
  const channel = supabase.channel(channelId);

  channel.on("broadcast", { event: "update" }, (payload) => {
    onUpdate(payload.payload);
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
};

// Enhanced function for partial updates with type safety
export const subscribeToResourceUpdates = (
  channelId: string,
  onUpdate: (payload: ResourceUpdatePayload) => void,
  onProgressUpdate?: (payload: {
    resourceId: string;
    processedChunks: number;
    knowledgeId: string;
  }) => void
) => {
  const channel = supabase.channel(channelId);

  // Listen for regular updates
  channel.on("broadcast", { event: "update" }, (payload) => {
    // Ensure we have a valid payload with resourceId
    if (payload.payload && payload.payload.resourceId) {
      onUpdate(payload.payload as ResourceUpdatePayload);
    }
  });

  // Listen for processed-chunks events
  if (onProgressUpdate) {
    channel.on("broadcast", { event: "processed-chunks" }, (payload) => {
      if (
        payload.payload &&
        payload.payload.resourceId &&
        payload.payload.processedChunks
      ) {
        onProgressUpdate({
          resourceId: payload.payload.resourceId,
          processedChunks: payload.payload.processedChunks,
          knowledgeId: payload.payload.knowledgeId,
        });
      }
    });
  }

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
};
