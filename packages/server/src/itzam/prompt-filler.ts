"use server";
import Itzam from "itzam";
import { env } from "@itzam/utils";

const itzam = new Itzam(env.ITZAM_API_KEY);

export async function fillPrompt(
  title: string,
  prompt: string,
  description: string | undefined
) {
  const response = await itzam.streamText({
    input: `
    Title: ${title}
    Initial prompt: ${prompt ?? "No prompt provided"}
    Description: ${description ?? "No description provided"}
    `,
    workflowSlug: "prompt-filler",
  });

  return response;
}
