"use server";

import { env } from "@itzam/utils";

interface SendDiscordMessageParams {
  content: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  timestamp?: string;
  url?: string;
  thumbnail?: {
    url: string;
  };
}

export async function sendDiscordNotification({
  content,
  username,
  avatar_url,
  embeds,
}: SendDiscordMessageParams): Promise<boolean> {
  if (env.NODE_ENV === "development") {
    console.log("[DEV] 👾 Discord notification:", content);
    return true;
  }

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        username,
        avatar_url,
        embeds,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error: string };
      throw new Error(errorData.error || "Failed to send notification");
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return false;
  }
}
