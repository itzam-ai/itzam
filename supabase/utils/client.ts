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

export const subscribeToChannel = (
  channelId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (payload: any) => void
) => {
  const channel = supabase.channel(channelId);

  channel.on("broadcast", { event: "update" }, (payload) => {
    onUpdate(payload.payload);
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
