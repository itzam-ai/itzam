import {
  type CoreUserMessage,
  jsonSchema,
  type UserContent,
  zodSchema,
} from "ai";
import jsonSchemaToZod from "json-schema-to-zod";
import { extension } from "mime-types";
import { z } from "zod";
import type { Model } from "../db/model/actions";
import { createRunWithCost } from "../db/run/actions";
import { runs } from "../db/schema";
import { uploadFileToBucket } from "../r2/server";
import type { PreRunDetails } from "../types";
import { findRelevantContent } from "./embeddings";
import { createUserProviderRegistry } from "./registry";
import type { CreateAiParamsFn } from "./types";

const defaultSchema = z.object({
  text: z.string().describe("The generated output text"),
});

export type GenerationResponse = z.infer<typeof defaultSchema>;
export type StructuredGenerationResponse = unknown;

// return a promise that resolves with a File instance
export async function getFileFromString(
  url: string,
  filename: string,
  mimeType: string
) {
  console.log("Getting file from string", {
    url,
    filename,
    mimeType,
  });

  if (isBase64File(url)) {
    const arr = url.split(",");
    const mime = arr[0]?.match(/:(.*?);/)?.[1];
    const bstr = atob(arr[arr.length - 1] ?? "");
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], filename, { type: mime || mimeType });
    return Promise.resolve(file);
  }

  if (isUrlFile(url)) {
    const file = await fetch(url);

    if (!file.ok) {
      throw new Error("Could not fetch file");
    }

    console.log("File", file);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const type = mimeType || file.headers.get("content-type");

    if (!type) {
      throw new Error("Could not determine mime type");
    }

    return new File([buffer], filename, {
      type,
    });
  }

  throw new Error("Invalid file");
}

// @ts-expect-error TODO: fix typing
export const createAiParams: CreateAiParamsFn = async ({
  userId,
  input,
  model,
  attachments,
  prompt,
  schema: schemaProp,
  stream = false,
  run,
  ...rest
}) => {
  let schema: ReturnType<typeof zodSchema> | undefined =
    zodSchema(defaultSchema);
  let output: "object" | "array" | "enum" = "object" as const;

  if (schemaProp) {
    const schemaPropType = schemaProp["type"];
    if (schemaPropType === "array") {
      const zodArraySchema = eval(
        jsonSchemaToZod(schemaProp, { module: "cjs" })
      );
      output = "array";
      schema = zodSchema(zodArraySchema.element);
    } else if (schemaPropType === "string" && "enum" in schemaProp) {
      rest.enum = schemaProp["enum"] as string[];
      schema = undefined;
      output = "enum";
    } else {
      schema = jsonSchema(schemaProp);
    }
  }

  console.log("Schema", schema);

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
      const mimeType =
        attachment.mimeType ||
        (attachment.file.startsWith("data:")
          ? attachment.file.split(";")[0]?.split(":")[1]
          : attachment.file.split(".").pop());

      const fileExt = extension(
        attachment.mimeType || "application/octet-stream"
      );
      // if (attachment.type === "file") {
      //   // get extension from mime type
      //   // Convert to File instance if not already
      //   const fileData = await getFileFromString(
      //     attachment.file,
      //     `file.${fileExt}`,
      //     attachment.mimeType || "application/octet-stream"
      //   );

      //   // Upload file to R2
      //   await uploadFileToBucket(fileData, "attachments");
      //   content.push({
      //     type: "file",
      //     data: attachment.file,
      //     mimeType: attachment.mimeType || fileData.type,
      //   });
      // } else if (attachment.type === "image") {
      // Convert to File instance if not already
      const imageData = await getFileFromString(
        attachment.file,
        `image.${fileExt}`,
        attachment.mimeType || "image/png"
      );
      // Upload image to R2
      await uploadFileToBucket(imageData, "attachments");
      content.push({
        type: "image",
        image: attachment.file,
        mimeType: attachment.mimeType || imageData.type,
      });
      // } else {
      //   throw new Error("Invalid attachment type");
      // }
    }
  }

  const messages: CoreUserMessage[] = [
    {
      role: "user",
      content,
    },
  ];

  const providerRegistry = await createUserProviderRegistry(userId);

  const systemPromptWithKnowledge = await insertKnowledgeInPrompt(
    prompt,
    input ?? "",
    run
  );

  console.log("System prompt with knowledge", systemPromptWithKnowledge);

  // Common Parameters
  const aiParams = {
    // @ts-expect-error TODO: fix typing
    model: providerRegistry.languageModel(model.tag),
    system: systemPromptWithKnowledge,
    messages,
    schema,
    output,
    ...rest,
  };

  return aiParams;
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

  console.log("Run completion", {
    text,
    type: typeof text,
  });

  void createRunWithCost({
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

export function isBase64File(file: string) {
  return file.startsWith("data:");
}

export function isUrlFile(file: string) {
  return file.startsWith("http");
}

export async function insertKnowledgeInPrompt(
  prompt: string,
  input: string,
  run: PreRunDetails
) {
  const { similarChunks, resourceIds } = await findRelevantContent(
    input,
    run.workflowId
  );

  // Add resources used in context to run
  run.resourceIds = resourceIds;

  if (similarChunks.length === 0) {
    return prompt;
  }

  return `${prompt}

<context>
Relevant content found in user's provided knowledge base:
${similarChunks.map((c) => c.content).join("\n")}
</context>`;
}
