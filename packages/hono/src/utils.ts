import type { Attachment, AttachmentWithUrl } from "@itzam/server/ai/types";
import { createAiParams, processAttachments } from "@itzam/server/ai/utils";
import {
  updateApiKeyLastUsed,
  validateApiKey,
} from "@itzam/server/db/api-keys/actions";
import { getThreadByIdAndUserIdWithContexts } from "@itzam/server/db/thread/actions";
import { getWorkflowBySlugAndUserIdWithModelAndModelSettingsAndContexts } from "@itzam/server/db/workflow/actions";
import { createClient } from "@supabase/supabase-js";
import { env } from "@itzam/utils/env";
import { v7 as uuidv7 } from "uuid";
import "zod-openapi/extend";
import type { NonLiteralJson } from "./client/schemas";
import { StatusCode } from "./errors";

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

    if ("error" in thread) {
      return {
        error: thread.error,
        status: thread.status as StatusCode,
      };
    }

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

    if ("error" in workflow) {
      return {
        error: workflow.error,
        status: workflow.status as StatusCode,
        possibleValues: workflow.possibleValues || [],
      };
    }
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
      return {
        error: "Model does not support vision",
        status: 400 as StatusCode,
      };
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
    return { error: "API key is required", status: 401 as StatusCode };
  }

  // Check if it's an API key (starts with itzam_) or an auth token
  if (apiKey.startsWith("itzam_")) {
    // Validate API Key
    const validatedApiKey = await validateApiKey(apiKey);

    if ("error" in validatedApiKey) {
      return { error: "Invalid API key", status: 401 as StatusCode };
    }

    void updateApiKeyLastUsed(validatedApiKey.id);

    return { userId: validatedApiKey.userId };
  } else {
    // Validate auth token using Supabase
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.getUser(apiKey);
    
    if (error || !data.user) {
      return { error: "Invalid auth token", status: 401 as StatusCode };
    }

    return { userId: data.user.id };
  }
};
