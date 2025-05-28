"use server";

import { tryCatch } from "@itzam/utils";
import { v7 as uuidv7 } from "uuid";
import { generateTextResponse, generateTextStream } from "../ai/generate/text";
import { createAiParams } from "../ai/utils";
import { getModelById } from "../db/model/actions";
import { getWorkflowBySlugAndUserIdWithModelAndModelSettings } from "../db/workflow/actions";
import { sendDiscordNotification } from "../discord/actions";
import type { PreRunDetails } from "../types";
import { getUser } from "../db/auth/actions";

export type GenerateTextResponse = {
  output: string;
  runId: string;
};

export async function generateText(
  input: string,
  prompt: string,
  modelId: string | undefined,
  workflowSlug: string
): Promise<GenerateTextResponse> {
  const startTime = Date.now();

  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const workflow = await getWorkflowBySlugAndUserIdWithModelAndModelSettings(
    user.data.user.id,
    workflowSlug
  );

  if (!workflow || "error" in workflow) {
    throw new Error("Workflow not found");
  }

  const model = await getModelById(modelId ?? "");

  if (!model) {
    throw new Error("Model not found");
  }

  const run: PreRunDetails = {
    id: uuidv7(),
    origin: "WEB" as const,
    input,
    prompt,
    groupId: null,
    modelId: model.id,
    workflowId: workflow.id,
    resourceIds: [],
  };

  const aiParams = await createAiParams({
    input,
    prompt,
    model,
    userId: user.data.user.id,
    run,
  });

  const result = await tryCatch(
    generateTextResponse(aiParams, run, model, startTime)
  );

  if (result.error) {
    await sendDiscordNotification({
      content: result.error.message,
      username: "Itzam Generate Text Error",
    });

    console.error(result.error);
    throw new Error(result.error.message);
  }

  return {
    output: result.data.output.text,
    runId: result.data.metadata.runId,
  };
}

export async function generateStreamedText(
  input: string,
  prompt: string,
  modelId: string | undefined,
  workflowSlug: string
) {
  const startTime = Date.now();

  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const workflow = await getWorkflowBySlugAndUserIdWithModelAndModelSettings(
    user.data.user.id,
    workflowSlug
  );

  if (!workflow || "error" in workflow) {
    throw new Error("Workflow not found");
  }

  const model = await getModelById(modelId ?? "");

  if (!model) {
    throw new Error("Model not found");
  }

  const run: PreRunDetails = {
    id: uuidv7(),
    origin: "WEB" as const,
    input,
    prompt,
    groupId: null,
    modelId: model.id,
    workflowId: workflow.id,
    resourceIds: [],
  };

  const aiParams = await createAiParams({
    input,
    prompt,
    model,
    userId: user.data.user.id,
    run,
  });

  const response = await generateTextStream(
    aiParams,
    run,
    model,
    startTime,
    undefined,
    "text"
  );

  if (!response.body) {
    throw new Error("No response body received");
  }

  return [response.body as ReadableStream, run.id];
}
