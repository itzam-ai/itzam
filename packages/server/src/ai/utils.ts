import { CoreMessage, jsonSchema, type UserContent, zodSchema } from "ai";
import { StatusCode } from "hono/utils/http-status";
import jsonSchemaToZod from "json-schema-to-zod";
import { extension } from "mime-types";
import type { Model } from "../db/model/actions";
import {
  createRunWithCost,
  getRunsForContextByThreadId,
} from "../db/run/actions";
import { runs } from "../db/schema";
import { uploadFileToBucket } from "../r2/server";
import type { PreRunDetails } from "../types";
import { findRelevantContent } from "./embeddings";
import { createUserProviderRegistry } from "./registry";
import { getWorkflowComposioTools } from "./tools";
import type { Attachment, AttachmentWithUrl, CreateAiParamsFn } from "./types";

// return a promise that resolves with a File instance
export async function getFileFromString(
  url: string,
  filename: string,
  mimeType: string
) {
  // Data URI
  if (isDataUri(url)) {
    const arr = url.split(",");
    const mime = arr[0]?.match(/:(.*?);/)?.[1];
    const bstr = atob(arr[arr.length - 1] ?? "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const finalMimeType = mime || mimeType;
    if (!finalMimeType) {
      throw new Error(
        "Could not determine mime type from data URI or provided mimeType"
      );
    }

    const file = new File([u8arr], filename, { type: finalMimeType });
    return Promise.resolve(file);
  }

  // Base64
  if (isBase64String(url)) {
    if (!mimeType) {
      throw new Error("Mime type is required for raw base64 strings");
    }

    try {
      const bstr = atob(url);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      const file = new File([u8arr], filename, { type: mimeType });
      return Promise.resolve(file);
    } catch (error) {
      throw new Error("Invalid base64 string provided");
    }
  }

  // URL
  if (isUrlFile(url)) {
    const file = await fetch(url);

    if (!file.ok) {
      throw new Error("Could not fetch file");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const type = mimeType || file.headers.get("content-type");

    if (!type) {
      throw new Error(
        "Could not determine mime type from URL response or provided mimeType"
      );
    }

    return new File([buffer], filename, {
      type,
    });
  }

  throw new Error("Invalid file: must be a data URI, base64 string, or URL");
}

export const handleSchema = (
  schemaProp: Parameters<CreateAiParamsFn>[0]["schema"]
) => {
  let schema: ReturnType<typeof zodSchema> | undefined = undefined;
  let output: "no-schema" | "object" | "array" | "enum" = "no-schema";
  let enumProp: string[] | undefined = undefined;

  if (schemaProp) {
    const schemaPropType = schemaProp["type"];
    if (schemaPropType === "array") {
      const zodArraySchema = eval(
        jsonSchemaToZod(schemaProp, { module: "cjs" })
      );
      output = "array";
      schema = zodSchema(zodArraySchema.element);
    } else if (schemaPropType === "string" && "enum" in schemaProp) {
      enumProp = schemaProp["enum"] as string[];
      schema = undefined;
      output = "enum";
    } else {
      schema = jsonSchema(schemaProp);
      output = "object";
    }
  }

  return {
    schema,
    output,
    enum: enumProp,
  };
};

// @ts-expect-error TODO: fix typing
export const createAiParams: CreateAiParamsFn = async ({
  userId,
  input,
  model,
  attachments,
  prompt,
  schema: schemaProp,
  run,
  ...rest
}) => {
  const { schema, output, enum: enumProp } = handleSchema(schemaProp);

  if (enumProp) {
    rest.enum = enumProp;
  }

  const imageTypes = ["png", "jpeg", "jpg", "webp"];

  const content: UserContent = input
    ? [
        {
          type: "text",
          text: input,
        },
      ]
    : [];

  if (attachments) {
    for (const attachment of attachments) {
      if (imageTypes.some((type) => attachment.mimeType?.includes(type))) {
        content.push({
          type: "image",
          image: attachment.file,
          mimeType: attachment.mimeType,
        });
      } else {
        content.push({
          type: "file",
          image: attachment.file,
          // @ts-expect-error
          mimeType: attachment.mimeType,
        });
      }
    }
  }

  const messages: CoreMessage[] = [
    {
      role: "user",
      content,
    },
  ];

  // If threadId is provided, get conversation history and prepend to messages
  if (run.threadId) {
    const threadRuns = await getRunsForContextByThreadId(run.threadId);

    // Convert thread runs to messages format and prepend to current messages
    const conversationHistory: {
      role: "user" | "assistant";
      content: string;
    }[] = [];

    for (const threadRun of threadRuns) {
      // Skip the current run if it's already in the thread
      if (threadRun.id === run.id) continue;

      // Add user message
      conversationHistory.push({
        role: "user",
        content: threadRun.input,
      });

      // Add assistant message if there's output
      if (threadRun.output) {
        conversationHistory.push({
          role: "assistant",
          content: threadRun.output,
        });
      }
    }

    // Prepend conversation history to current messages
    messages.unshift(...conversationHistory);
  }

  const providerRegistry = await createUserProviderRegistry(userId);

  const {
    prompt: systemPromptWithKnowledge,
    error,
    status,
    possibleValues,
  } = await insertKnowledgeInPrompt(prompt, input ?? "", run);

  if (error) {
    return {
      error,
      status: status as StatusCode,
      possibleValues,
    };
  }

  console.log("System prompt with knowledge ⬇️");
  console.log(systemPromptWithKnowledge);

  // Get tools configured for this workflow
  let tools = undefined;
  if (run.workflowId) {
    try {
      const workflowTools = await getWorkflowComposioTools(
        run.workflowId,
        userId
      );
      if (Object.keys(workflowTools).length > 0) {
        tools = workflowTools;
        console.log(
          `Loaded ${Object.keys(workflowTools).length} tools for workflow ${run.workflowId}`
        );
      }
    } catch (error) {
      console.error("Failed to load workflow tools:", error);
    }
  }

  return {
    model: providerRegistry.languageModel(model.tag as any),
    system: systemPromptWithKnowledge,
    messages,
    schema,
    output,
    attachments,
    tools,
    ...rest,
  };
};

type HandleRunCompletionParams = {
  run: PreRunDetails;
  model: Model;
  text: string;
  inputTokens: number;
  outputTokens: number;
  startTime: number;
  status: (typeof runs.$inferSelect)["status"];
  error?: string;
  fullResponse: unknown;
  metadata: Record<string, unknown>;
};

export async function handleRunCompletion({
  run,
  model,
  text,
  inputTokens,
  outputTokens,
  startTime,
  status = "COMPLETED",
  fullResponse,
  metadata,
  error,
}: HandleRunCompletionParams) {
  const endTime = Date.now();
  const durationInMs = endTime - startTime;

  await createRunWithCost({
    ...run,
    model: model,
    status,
    output: text,
    inputTokens,
    outputTokens,
    durationInMs,
    fullResponse,
    metadata,
    error: error ?? null,
  });
}

export function isDataUri(file: string): boolean {
  return file.startsWith("data:");
}

export function isBase64String(str: string): boolean {
  // Check if string contains only valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

  // Base64 strings should have length that's a multiple of 4 (when properly padded)
  // and should be at least a reasonable length for a file
  if (str.length < 4 || str.length % 4 !== 0) {
    return false;
  }

  return base64Regex.test(str);
}

export function isUrlFile(file: string): boolean {
  return file.startsWith("http");
}

export async function insertKnowledgeInPrompt(
  prompt: string,
  input: string,
  run: PreRunDetails
) {
  const { similarChunks, resourceIds, error, status, possibleValues } =
    await findRelevantContent(
      input,
      run.knowledgeId,
      run.contextSlugs,
      run.workflowId
    );

  if (error) {
    return {
      prompt,
      error,
      status: status as StatusCode,
      possibleValues,
    };
  }

  // Add resources used in context to run
  run.resourceIds = resourceIds;

  if (similarChunks.length === 0) {
    return {
      prompt,
    };
  }

  return {
    prompt: `${prompt}

<context>
Relevant content found in user's provided knowledge base:

${similarChunks.map((c) => c.content).join("\n")}
</context>`,
  };
}

export async function processAttachments(
  attachments: Attachment[],
  userId: string
) {
  const processedAttachments: AttachmentWithUrl[] = [];

  for (const attachment of attachments) {
    // Get file extension from mime type
    const fileExt = extension(
      attachment.mimeType || "application/octet-stream"
    );

    // Convert to File instance if not already
    const file = await getFileFromString(
      attachment.file,
      `image.${fileExt}`,
      attachment.mimeType || "image/png"
    );

    // Upload image to R2
    const { imageUrl } = await uploadFileToBucket(file, userId);

    processedAttachments.push({
      ...attachment,
      url: imageUrl,
      mimeType: attachment.mimeType || file.type,
    });
  }

  return processedAttachments;
}
