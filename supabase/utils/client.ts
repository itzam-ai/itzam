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

export type UsageUpdatePayload = {
  newFileSize: number;
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
  onUpdate: (payload: ResourceUpdatePayload) => void
) => {
  const channel = supabase.channel(channelId);

  // Listen for regular updates
  channel.on("broadcast", { event: "update" }, (payload) => {
    // Ensure we have a valid payload with resourceId
    if (payload.payload && payload.payload.resourceId) {
      onUpdate(payload.payload as ResourceUpdatePayload);
    }
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
};

export const subscribeToUsageUpdates = (
  channelId: string,
  onUpdate: (payload: UsageUpdatePayload) => void
) => {
  const channel = supabase.channel(channelId);

  // Listen for regular updates
  channel.on("broadcast", { event: "update" }, (payload) => {
    // Ensure we have a valid payload with resourceId
    if (payload.payload && payload.payload.newFileSize) {
      onUpdate(payload.payload as UsageUpdatePayload);
    }
  });

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
};
