"use server";
import Itzam from "itzam";
import { env } from "@itzam/utils";

const itzam = new Itzam(env.ITZAM_API_KEY);

export async function generatePrompt(
  title: string,
  description: string | undefined
) {
  try {
    const response = await itzam.generateText({
      input: `
    Title: ${title}
    Description: ${description ?? "No description provided"}
    `,
      workflowSlug: "prompt-generator",
    });

    return response.text;
  } catch (error) {
    console.error(error);
    return "You are a helpful and friendly assistant that can help with a wide range of tasks.";
  }
}
