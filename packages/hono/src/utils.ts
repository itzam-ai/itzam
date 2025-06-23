import type { Attachment, AttachmentWithUrl } from "@itzam/server/ai/types";
import { createAiParams, processAttachments } from "@itzam/server/ai/utils";
import {
  updateApiKeyLastUsed,
  validateApiKey,
} from "@itzam/server/db/api-keys/actions";
import { db } from "@itzam/server/db/index";
import { contexts, threads } from "@itzam/server/db/schema";
import { getThreadContextIds } from "@itzam/server/db/thread/actions";
import { getWorkflowBySlugAndUserIdWithModelAndModelSettings } from "@itzam/server/db/workflow/actions";
import { notifyDiscordError } from "@itzam/utils";
import { tryCatch } from "@itzam/utils/try-catch";
import { eq, inArray, or, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import "zod-openapi/extend";
import type { NonLiteralJson } from "./client/schemas";

export type PreRunDetails = {
  id: string;
  origin: "SDK" | "WEB";
  input: string;
  prompt: string;
  threadId: string | null;
  modelId: string;
  workflowId: string;
  resourceIds: string[];
  contextIds?: string[];
  attachments: AttachmentWithUrl[];
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

// Helper function to resolve context identifiers (IDs or slugs) to context IDs for a specific workflow
export const resolveContextIds = async (
  contextIdentifiers: string[],
  workflowId: string
): Promise<string[]> => {
  if (contextIdentifiers.length === 0) {
    return [];
  }

  // Query contexts that match either ID or slug and belong to the workflow
  const matchedContexts = await db.query.contexts.findMany({
    where: sql`(${inArray(contexts.id, contextIdentifiers)} OR ${inArray(contexts.slug, contextIdentifiers)}) AND ${eq(contexts.workflowId, workflowId)}`,
    columns: {
      id: true,
    },
  });

  return matchedContexts.map(c => c.id);
};

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
  contexts,
}: {
  userId: string;
  workflowSlug?: string;
  threadId: string | null;
  schema?: NonLiteralJson | null;
  input: string;
  attachments?: Attachment[];
  contexts?: string[];
}) => {
  let workflow;

  if (workflowSlug) {
    // Get workflow by slug
    workflow = await getWorkflowBySlugAndUserIdWithModelAndModelSettings(
      userId,
      workflowSlug
    );
  } else if (threadId) {
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
      with: {
        workflow: {
          with: {
            model: true,
            modelSettings: true,
          },
        },
      },
    });

    if (!thread) {
      return { error: "Thread not found", status: 404 as StatusCode };
    }

    workflow = thread.workflow;
  } else {
    return {
      error: "Either workflowSlug or threadId is required",
      status: 400 as StatusCode,
    };
  }

  if (!workflow || "error" in workflow) {
    return { error: "Workflow not found", status: 404 as StatusCode };
  }

  // Resolve request context identifiers to IDs (for contexts passed in the request)
  let requestContextIds: string[] = [];
  if (contexts && contexts.length > 0) {
    requestContextIds = await resolveContextIds(contexts, workflow.id);
  }
  
  // Get contexts from thread if threadId is provided
  let threadContextIds: string[] = [];
  if (threadId) {
    threadContextIds = await getThreadContextIds(threadId);
  }
  
  // Merge thread contexts with request contexts, removing duplicates
  const finalContextIds = [...new Set([...threadContextIds, ...requestContextIds])];

  const run: PreRunDetails = {
    id: uuidv7(),
    origin: "SDK" as const,
    input,
    prompt: workflow.prompt,
    threadId: threadId || null,
    modelId: workflow.modelId,
    workflowId: workflow.id,
    resourceIds: [],
    contextIds: finalContextIds,
    attachments: [],
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
