import type { Attachment } from "@itzam/server/ai/types";
import { createAiParams } from "@itzam/server/ai/utils";
import {
  updateApiKeyLastUsed,
  validateApiKey,
} from "@itzam/server/db/api-keys/actions";
import { getWorkflowBySlugAndUserIdWithModelAndModelSettings } from "@itzam/server/db/workflow/actions";
import { tryCatch } from "@itzam/utils/try-catch";
import { v7 as uuidv7 } from "uuid";
import "zod-openapi/extend";
import type { NonLiteralJson } from "./client/schemas";

export type PreRunDetails = {
  id: string;
  origin: "SDK" | "WEB";
  input: string;
  prompt: string;
  groupId: string | null;
  modelId: string;
  workflowId: string;
  resourceIds: string[];
};

type ValidationError = {
  error: string;
  status: 401 | 403 | 404;
  userId: null;
  startTime: null;
};

type ValidationSuccess = {
  error: null;
  userId: string;
  startTime: number;
};

export type StatusCode = 200 | 400 | 401 | 404 | 500;

type ValidationResult = ValidationError | ValidationSuccess;

// Common error response function
export const createErrorResponse = (error: unknown) => {
  console.error("Error in endpoint:", error);
  const errorMessage =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : "Unknown error occurred";

  return {
    error: "Failed to generate content",
    details: errorMessage,
    stack:
      process.env.NODE_ENV === "development"
        ? (error as Error).stack
        : undefined,
  };
};

// Common workflow setup function
export const setupRunGeneration = async ({
  userId,
  workflowSlug,
  groupId,
  schema,
  input,
  attachments,
}: {
  userId: string;
  workflowSlug: string;
  groupId: string | null;
  schema?: NonLiteralJson | null;
  input: string;
  attachments?: Attachment[];
}) => {
  const workflow = await getWorkflowBySlugAndUserIdWithModelAndModelSettings(
    userId,
    workflowSlug
  );

  if (!workflow || "error" in workflow) {
    return { error: "Workflow not found", status: 404 as StatusCode };
  }

  const run: PreRunDetails = {
    id: uuidv7(),
    origin: "SDK" as const,
    input,
    prompt: workflow.prompt,
    groupId: groupId || null,
    modelId: workflow.modelId,
    workflowId: workflow.id,
    resourceIds: [],
  };

  if (attachments) {
    if (!workflow.model.hasVision) {
      throw new Error("Model does not support vision");
    }
  }

  const aiParams = await createAiParams({
    userId,
    input,
    prompt: workflow.prompt,
    model: workflow.model,
    // @ts-expect-error TODO: fix typing
    schema,
    attachments,
    run,
  });

  return { workflow, run, aiParams };
};

// Common validation function
export const validateRequest = async (
  apiKey: string | undefined | null
): Promise<ValidationResult> => {
  const startTime = Date.now();

  if (!apiKey) {
    return {
      error: "API key is required",
      status: 401,
      userId: null,
      startTime: null,
    };
  }

  // Validate API Key
  const { data: validatedApiKey, error } = await tryCatch(
    validateApiKey(apiKey)
  );

  if (error) {
    return {
      error: "Invalid API key",
      status: 401,
      userId: null,
      startTime: null,
    };
  }

  void updateApiKeyLastUsed(validatedApiKey.id);

  return { error: null, userId: validatedApiKey.userId, startTime };
};
