import "server-only";

import { openai } from "@ai-sdk/openai";
import { db } from "@itzam/server/db/index";
import { chunks, resources } from "@itzam/server/db/schema";
import { logger, task } from "@trigger.dev/sdk/v3";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";
import { v7 } from "uuid";
import { z } from "zod";
import { simpleChunk } from "./utils/chunker.js";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

const ResourceSchema = z.object({
  resources: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["FILE", "LINK"]),
      mimeType: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      id: z.string().uuid().optional(),
    })
  ),
  knowledgeId: z.string(),
  workflowId: z.string(),
  userId: z.string().uuid(),
});

// UTILITY FUNCTIONS

// return a promise that resolves with a File instance
const getFileFromString = async (
  url: string,
  filename: string,
  mimeType: string
): Promise<File> => {
  logger.log("Getting file from string", {
    url: url.substring(0, 100) + "...", // Log only first 100 chars for security
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
      throw new Error(`Could not fetch file: ${file.statusText}`);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const type = mimeType || file.headers.get("content-type");

    if (!type) {
      throw new Error("Could not determine mime type");
    }

    return new File([buffer], filename, {
      type,
    });
  }

  throw new Error("Invalid file format");
};

const isBase64File = (file: string): boolean => {
  return file.startsWith("data:");
};

const isUrlFile = (file: string): boolean => {
  return file.startsWith("http://") || file.startsWith("https://");
};

// TIKA CONVERSION
const convertSingleFile = async (attachment: {
  file: string;
  mimeType: string;
  fileName: string;
}): Promise<{ text: string; fileSize: number }> => {
  try {
    // Convert string to File object
    const file = await getFileFromString(
      attachment.file,
      attachment.fileName,
      attachment.mimeType || "application/octet-stream"
    );

    // Send to Tika
    const tikaUrl = process.env.TIKA_URL || "http://localhost:9998/tika";
    const res = await fetch(tikaUrl, {
      method: "PUT",
      headers: {
        Accept: "text/plain",
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Failed to convert file: ${res.statusText}`);
    }

    const text = await res.text();
    return { text, fileSize: file.size };
  } catch (err) {
    logger.error("Error processing file:", { error: err });
    return { text: "", fileSize: 0 }; // Return empty string for failed conversions
  }
};

const generateFileTitle = async (
  text: string,
  originalFileName: string
): Promise<string> => {
  // limit text to 1000 characters
  const limitedText = text.slice(0, 1000);
  try {
    // For now, use a simple approach - in production you'd want to call your AI service
    // This is a placeholder - you should replace with actual AI call
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/workflows/file-title-generator/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ITZAM_API_KEY}`,
        },
        body: JSON.stringify({
          input: `
          Original file name: ${originalFileName}
          File content: ${limitedText}
        `,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.text || originalFileName;
    }

    return originalFileName;
  } catch (error) {
    logger.error("Error generating file title:", { error });
    return originalFileName;
  }
};

// MULTIPLE EMBEDDINGS (for files and links)
const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string | undefined }>> => {
  logger.log("Chunking value", { textLength: value.length });

  const chunkedTexts = simpleChunk(value, {
    chunkSize: 512,
    chunkOverlap: 50,
    minSentencesPerChunk: 1,
    minCharactersPerSentence: 12,
    delim: [". ", "! ", "? ", "\n"],
    includeDelim: "prev",
  });

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: chunkedTexts,
  });

  logger.log("Generated embeddings", { count: embeddings.length });

  return embeddings.map((e: any, i: string | number) => ({
    content: chunkedTexts[i],
    embedding: e,
  }));
};

const generateFileTitleForResource = async (
  text: string,
  resource: any,
  db: any
) => {
  let title = "";
  try {
    title = await generateFileTitle(text, resource.fileName ?? "");
  } catch (error) {
    title = resource.fileName ?? "";
    logger.error("Error generating file title", { error });
  }

  await db
    .update(resources)
    .set({
      title: title,
    })
    .where(eq(resources.id, resource.id));

  return title;
};

// MAIN EMBEDDING CREATION FUNCTION
const createEmbeddings = async (
  resource: any,
  workflowId: string,
  userId: string,
  db: any
) => {
  let title = resource.fileName ?? "";

  try {
    logger.log("Starting embedding creation", {
      resourceId: resource.id,
      workflowId,
    });

    // SEND TO TIKA
    const { text: textFromTika, fileSize } = await convertSingleFile({
      file: resource.url,
      mimeType: resource.mimeType,
      fileName: resource.fileName,
    });

    // UPDATE RESOURCE WITH FILE SIZE
    await db
      .update(resources)
      .set({ fileSize })
      .where(eq(resources.id, resource.id));

    title = await generateFileTitleForResource(textFromTika, resource, db);

    logger.log("File converted and title generated", {
      resourceId: resource.id,
      title,
      textLength: textFromTika.length,
    });

    if (!textFromTika) {
      throw new Error("No text from Tika conversion");
    }

    // GENERATE EMBEDDINGS
    const embeddings = await generateEmbeddings(textFromTika);

    // SAVE CHUNK TO DB
    const createdChunks = await db
      .insert(chunks)
      .values(
        embeddings.map((embedding) => ({
          ...embedding,
          id: v7(),
          resourceId: resource.id,
          content: embedding.content ?? "",
          workflowId,
        }))
      )
      .returning();

    logger.log("Chunks created successfully", {
      resourceId: resource.id,
      chunksCount: createdChunks.length,
    });

    await db
      .update(resources)
      .set({ status: "PROCESSED" })
      .where(eq(resources.id, resource.id));

    return {
      resourceId: resource.id,
      title,
      chunksCount: createdChunks.length,
      status: "PROCESSED" as const,
    };
  } catch (error) {
    logger.error("Error creating embeddings", {
      error,
      resourceId: resource.id,
    });

    await db
      .update(resources)
      .set({ status: "FAILED" })
      .where(eq(resources.id, resource.id));

    return {
      resourceId: resource.id,
      title,
      chunksCount: 0,
      status: "FAILED" as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const chunkAndEmbedTask = task({
  id: "chunk-and-embed",
  maxDuration: 300, // 5 minutes
  run: async (payload: z.infer<typeof ResourceSchema>) => {
    logger.log("Starting chunk and embed task", {
      resourcesCount: payload.resources.length,
      knowledgeId: payload.knowledgeId,
      workflowId: payload.workflowId,
    });

    // Validate payload
    const parsed = ResourceSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(`Invalid payload: ${parsed.error.message}`);
    }

    try {
      // Create resources in database
      const resourcesCreated = await db
        .insert(resources)
        .values(
          parsed.data.resources.map((resource) => ({
            ...resource,
            id: resource.id ?? v7(),
            knowledgeId: parsed.data.knowledgeId,
          }))
        )
        .returning();

      logger.log("Resources created in database", {
        count: resourcesCreated.length,
      });

      // Process each resource for embeddings
      const results = await Promise.allSettled(
        resourcesCreated.map((resource) =>
          createEmbeddings(
            resource,
            parsed.data.workflowId,
            parsed.data.userId,
            db
          )
        )
      );

      // Collect results
      const processedResults = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          logger.error("Failed to process resource", {
            resourceIndex: index,
            error: result.reason,
          });
          return {
            resourceId: resourcesCreated[index]?.id || "unknown",
            title: resourcesCreated[index]?.fileName || "unknown",
            chunksCount: 0,
            status: "FAILED" as const,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Processing failed",
          };
        }
      });

      const successCount = processedResults.filter(
        (r) => r.status === "PROCESSED"
      ).length;
      const failedCount = processedResults.filter(
        (r) => r.status === "FAILED"
      ).length;

      logger.log("Task completed", {
        totalResources: resourcesCreated.length,
        successCount,
        failedCount,
      });

      return {
        success: true,
        resources: resourcesCreated,
        results: processedResults,
        summary: {
          total: resourcesCreated.length,
          processed: successCount,
          failed: failedCount,
        },
      };
    } catch (error) {
      logger.error("Error in chunk and embed task", { error });
      throw error;
    }
  },
});
