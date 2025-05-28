import "server-only";

import { openai } from "@ai-sdk/openai";
import { db } from "@itzam/server/db/index";
import { chunks, resources } from "@itzam/server/db/schema";
import { supabase } from "@itzam/supabase/server";
import { env } from "@itzam/utils/env";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { logger, task } from "@trigger.dev/sdk/v3";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";
import { Itzam } from "itzam";
import { v7 } from "uuid";
import { z } from "zod";

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
    url,
    filename,
    mimeType,
  });

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
  return logger.trace("convert-single-file", async (span) => {
    const start = Date.now();
    try {
      // Convert string to File object
      const file = await getFileFromString(
        attachment.file,
        attachment.fileName,
        attachment.mimeType || "application/octet-stream"
      );

      // Send to Tika
      const tikaUrl = env.TIKA_URL || "http://localhost:9998/tika";
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
      const end = Date.now();
      logger.log("Tika conversion completed", {
        fileName: attachment.fileName,
        durationMs: end - start,
        fileSize: file.size,
        textLength: text.length,
      });
      span.setAttribute("fileName", attachment.fileName);
      span.setAttribute("durationMs", end - start);
      span.setAttribute("fileSize", file.size);
      span.setAttribute("textLength", text.length);
      return { text, fileSize: file.size };
    } catch (err) {
      const end = Date.now();
      logger.error("Error processing file:", {
        error: err,
        durationMs: end - start,
      });
      span.setAttribute("error", String(err));
      span.setAttribute("durationMs", end - start);
      return { text: "", fileSize: 0 }; // Return empty string for failed conversions
    }
  });
};

const itzam = new Itzam(env.ITZAM_API_KEY);

const generateFileTitle = async (
  text: string,
  originalFileName: string
): Promise<string> => {
  // limit text to 1000 characters
  const limitedText = text.slice(0, 1000);
  return logger.trace("generate-file-title", async (span) => {
    const start = Date.now();
    try {
      // For now, use a simple approach - in production you'd want to call your AI service
      // This is a placeholder - you should replace with actual AI call
      const response = await itzam.generateText({
        input: `
          Original file name: ${originalFileName}
          File content: ${limitedText}
          `,
        workflowSlug: "file-title-generator",
      });

      if (response.text) {
        const end = Date.now();
        logger.log("File title generated", {
          originalFileName,
          generatedTitle: response.text || originalFileName,
          durationMs: end - start,
        });
        span.setAttribute("originalFileName", originalFileName);
        span.setAttribute("generatedTitle", response.text || originalFileName);
        span.setAttribute("durationMs", end - start);
        return response.text || originalFileName;
      }

      const end = Date.now();
      logger.log("File title fallback to original", {
        originalFileName,
        durationMs: end - start,
      });
      span.setAttribute("originalFileName", originalFileName);
      span.setAttribute("durationMs", end - start);
      return originalFileName;
    } catch (error) {
      const end = Date.now();
      logger.error("Error generating file title:", {
        error,
        durationMs: end - start,
      });
      span.setAttribute("error", String(error));
      span.setAttribute("durationMs", end - start);
      return originalFileName;
    }
  });
};

const getChannelId = (resource: typeof resources.$inferSelect) => {
  return `knowledge-${resource.knowledgeId}-${
    resource.type === "FILE" ? "files" : "links"
  }`;
};

// MULTIPLE EMBEDDINGS (for files and links)
const generateEmbeddings = async (
  value: string
): Promise<Array<{ embedding: number[]; content: string | undefined }>> => {
  return logger.trace("generate-embeddings", async (span) => {
    const start = Date.now();
    logger.log("Chunking value", { textLength: value.length });
    span.setAttribute("textLength", value.length);
    const splitter = new TokenTextSplitter();

    const docOutput = await splitter.splitText(value);

    span.setAttribute("chunksCount", docOutput.length);

    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: docOutput,
    });

    const end = Date.now();
    logger.log("Generated embeddings", {
      count: embeddings.length,
      durationMs: end - start,
    });
    span.setAttribute("embeddingsCount", embeddings.length);
    span.setAttribute("durationMs", end - start);

    return embeddings.map((e: any, i: number) => ({
      content: docOutput[i],
      embedding: e,
    }));
  });
};

const generateFileTitleForResource = async (
  text: string,
  resource: any,
  db: any
) => {
  return logger.trace("generate-file-title-for-resource", async (span) => {
    let title = "";
    const start = Date.now();
    try {
      title = await generateFileTitle(text, resource.fileName ?? "");
    } catch (error) {
      title = resource.fileName ?? "";
      logger.error("Error generating file title", { error });
      span.setAttribute("error", String(error));
    }

    await db
      .update(resources)
      .set({
        title: title,
      })
      .where(eq(resources.id, resource.id));

    const end = Date.now();
    logger.log("Resource title updated", {
      resourceId: resource.id,
      title,
      durationMs: end - start,
    });
    span.setAttribute("resourceId", resource.id);
    span.setAttribute("title", title);
    span.setAttribute("durationMs", end - start);

    return title;
  });
};

// MAIN EMBEDDING CREATION FUNCTION
const createEmbeddings = async (
  resource: any,
  workflowId: string,
  userId: string,
  db: any
) => {
  return logger.trace("create-embeddings", async (span) => {
    let title = resource.fileName ?? "";
    const start = Date.now();

    try {
      logger.log("Starting embedding creation", {
        resourceId: resource.id,
        workflowId,
        startTime: new Date(start).toISOString(),
      });
      span.setAttribute("resourceId", resource.id);
      span.setAttribute("workflowId", workflowId);

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
      span.setAttribute("title", title);

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

      await sendUpdate(resource, {
        status: "PROCESSED",
        title,
        chunks: createdChunks,
        fileSize,
      });

      logger.log("Chunks created successfully", {
        resourceId: resource.id,
        chunksCount: createdChunks.length,
      });
      span.setAttribute("chunksCount", createdChunks.length);

      await db
        .update(resources)
        .set({ status: "PROCESSED" })
        .where(eq(resources.id, resource.id));

      const end = Date.now();
      logger.log("Embedding creation completed", {
        resourceId: resource.id,
        durationMs: end - start,
        endTime: new Date(end).toISOString(),
      });
      span.setAttribute("durationMs", end - start);
      span.setAttribute("endTime", new Date(end).toISOString());

      return {
        resourceId: resource.id,
        title,
        chunksCount: createdChunks.length,
        status: "PROCESSED" as const,
      };
    } catch (error) {
      const end = Date.now();
      logger.error("Error creating embeddings", {
        error,
        resourceId: resource.id,
        durationMs: end - start,
        endTime: new Date(end).toISOString(),
      });
      span.setAttribute("error", String(error));
      span.setAttribute("durationMs", end - start);
      span.setAttribute("endTime", new Date(end).toISOString());

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
  });
};

export const chunkAndEmbedTask = task({
  id: "chunk-and-embed",
  maxDuration: 300, // 5 minutes
  run: async (payload: z.infer<typeof ResourceSchema>) => {
    return logger.trace("chunk-and-embed-task", async (span) => {
      const start = Date.now();
      logger.log("Starting chunk and embed task", {
        resourcesCount: payload.resources.length,
        knowledgeId: payload.knowledgeId,
        workflowId: payload.workflowId,
        startTime: new Date(start).toISOString(),
      });
      span.setAttribute("resourcesCount", payload.resources.length);
      span.setAttribute("knowledgeId", payload.knowledgeId);
      span.setAttribute("workflowId", payload.workflowId);

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
        span.setAttribute("resourcesCreatedCount", resourcesCreated.length);

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

        const end = Date.now();
        logger.log("Task completed", {
          totalResources: resourcesCreated.length,
          successCount,
          failedCount,
          durationMs: end - start,
          endTime: new Date(end).toISOString(),
        });
        span.setAttribute("totalResources", resourcesCreated.length);
        span.setAttribute("successCount", successCount);
        span.setAttribute("failedCount", failedCount);
        span.setAttribute("durationMs", end - start);
        span.setAttribute("endTime", new Date(end).toISOString());

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
        const end = Date.now();
        logger.error("Error in chunk and embed task", {
          error,
          durationMs: end - start,
          endTime: new Date(end).toISOString(),
        });
        span.setAttribute("error", String(error));
        span.setAttribute("durationMs", end - start);
        span.setAttribute("endTime", new Date(end).toISOString());
        throw error;
      }
    });
  },
});

const sendUpdate = async (
  resource: typeof resources.$inferSelect,
  payload = {
    status: "PROCESSED",
    title: resource.title,
    chunks: 0,
    fileSize: resource.fileSize,
  }
) => {
  await supabase.channel(getChannelId(resource)).send({
    type: "broadcast",
    event: "update",
    payload: {
      ...payload,
      resourceId: resource.id,
    },
  });
};
