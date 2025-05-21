"use server";

import { env } from "@itzam/utils";
import Itzam from "itzam";

const itzam = new Itzam(env.ITZAM_API_KEY);

export async function generateTitle(
  messages: {
    role: "user" | "assistant" | "system" | "data";
    content: string;
  }[]
) {
  const response = await itzam.generateText({
    input: `Messages: ${JSON.stringify(messages)}`,
    workflowSlug: "chat-title-generator",
  });

  return response.text;
}
