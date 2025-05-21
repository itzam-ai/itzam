"use server";
import Itzam from "itzam";
import { env } from "@itzam/utils";

const itzam = new Itzam(env.ITZAM_API_KEY);

export async function generateFileTitle(
  text: string,
  originalFileName: string
) {
  // limit text to 1000 characters
  const limitedText = text.slice(0, 1000);

  const response = await itzam.generateText({
    input: `
    Original file name: ${originalFileName}
    File content: ${limitedText}
    `,
    workflowSlug: "file-title-generator",
  });

  return response.text;
}
