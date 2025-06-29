import type { Attachment, AttachmentWithUrl } from "@itzam/server/ai/types";
import { createAiParams, processAttachments } from "@itzam/server/ai/utils";
import {
  updateApiKeyLastUsed,
  validateApiKey,
} from "@itzam/server/db/api-keys/actions";
import { db } from "@itzam/server/db/index";
import { threads } from "@itzam/server/db/schema";
import { getWorkflowBySlugAndUserIdWithModelAndModelSettingsAndContexts } from "@itzam/server/db/workflow/actions";
import { notifyDiscordError } from "@itzam/utils";
import { tryCatch } from "@itzam/utils/try-catch";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import "zod-openapi/extend";
import type { NonLiteralJson } from "./client/schemas";
import { getThreadByIdAndUserIdWithContexts } from "@itzam/server/db/thread/actions";

export type PreRunDetails = {
  id: string;
  origin: "SDK" | "WEB";
  input: string;
  prompt: string;
  threadId: string | null;
  modelId: string;
  workflowId: string;
  resourceIds: string[];
  attachments: AttachmentWithUrl[];
  knowledgeId: string;
  contextSlugs: string[];
};

export type StatusCode = 200 | 400 | 401 | 404 | 500;

// Common error response function
export const createErrorResponse = (
  error: unknown,
  context?: { userId?: string; workflowSlug?: string; endpoint?: string }
) => {
  console.error("Error in endpoint:", error);

  // Send Discord notification for production errors
  if (error instanceof Error) {
    notifyDiscordError(error, context).catch(console.error);
  }

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
  threadId,
  schema,
  input,
  attachments,
  contextSlugs,
}: {
  userId: string;
  workflowSlug?: string;
  threadId: string | null;
  schema?: NonLiteralJson | null;
  input: string;
  attachments?: Attachment[];
  contextSlugs?: string[];
}) => {
  let workflow;

  if (threadId) {
    const thread = await getThreadByIdAndUserIdWithContexts(threadId, userId);
    workflow = thread.workflow;

    // Add thread context slugs to contextSlugs
    contextSlugs = [
      ...(contextSlugs || []),
      ...thread.threadContexts.map((c) => c.context.slug),
    ];
  } else if (workflowSlug) {
    // Get workflow by slug
    workflow =
      await getWorkflowBySlugAndUserIdWithModelAndModelSettingsAndContexts(
        userId,
        workflowSlug
      );
  } else {
    return {
      error: "Either workflowSlug or threadId is required",
      status: 400 as StatusCode,
    };
  }

  if (!workflow) {
    return { error: "Workflow not found", status: 404 as StatusCode };
  }

  const run: PreRunDetails = {
    id: uuidv7(),
    origin: "SDK" as const,
    input,
    prompt: workflow.prompt,
    threadId: threadId || null,
    modelId: workflow.modelId,
    workflowId: workflow.id,
    resourceIds: [],
    attachments: [],
    knowledgeId: workflow.knowledgeId,
    contextSlugs: contextSlugs || [],
  };

  let processedAttachments: AttachmentWithUrl[] = [];

  if (attachments) {
    if (!workflow.model.hasVision) {
      throw new Error("Model does not support vision");
    }

    // Process attachments (upload to R2)
    processedAttachments = await processAttachments(attachments, userId);

    // Add attachments to run
    run.attachments = processedAttachments;
  }

  const aiParams = await createAiParams({
    userId,
    input,
    prompt: workflow.prompt,
    model: workflow.model,
    // @ts-expect-error TODO: fix typing
    schema,
    attachments: processedAttachments,
    run,
  });

  return { workflow, run, aiParams, processedAttachments };
};

// Common validation function
export const validateRequest = async (apiKey: string | undefined | null) => {
  const startTime = Date.now();

  if (!apiKey) {
    return { error: "API key is required" };
  }

  // Validate API Key
  const { data: validatedApiKey, error } = await tryCatch(
    validateApiKey(apiKey)
  );

  if (error) {
    return { error: "Invalid API key" };
  }

  void updateApiKeyLastUsed(validatedApiKey.id);

  return { userId: validatedApiKey.userId };
};
