"use server";

import { createClient as createServerClient } from "../server";

export const sendChannelUpdate = async (channelId: string, payload: any) => {
  const supabase = await createServerClient();

  supabase.channel(channelId).send({
    type: "broadcast",
    event: "update",
    payload,
  });
};
