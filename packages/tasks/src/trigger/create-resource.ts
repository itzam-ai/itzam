import "server-only";

import { openai } from "@ai-sdk/openai";
import { db } from "@itzam/server/db/index";
import { chunks, resources } from "@itzam/server/db/schema";
import { supabase } from "@itzam/supabase/server";
import { logger, task } from "@trigger.dev/sdk/v3";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";
import { v7 } from "uuid";
import { z } from "zod";
import { chunkTask } from "./chunk";

const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");

const ResourceSchema = z.object({
  resources: z.array(
    z.discriminatedUnion("type", [
      z.object({
        url: z.string(),
        type: z.literal("LINK"),
        id: z.string().uuid().optional(),
      }),
      z.object({
        url: z.string(),
        type: z.literal("FILE"),
        mimeType: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        id: z.string().uuid().optional(),
      }),
    ])
  ),
  knowledgeId: z.string(),
  workflowId: z.string(),
  userId: z.string(),
});

export type Resource = Omit<
  typeof resources.$inferSelect,
  "fileName" | "mimeType"
> & {
  fileName: string;
  mimeType: string;
};

const getChannelId = (resource: Resource) => {
  return `knowledge-${resource.knowledgeId}-${
    resource.type === "FILE" ? "files" : "links"
  }`;
};

// MULTIPLE EMBEDDINGS (for files and links)
const generateEmbeddings = async (
  resource: Resource
): Promise<Array<{ embedding: number[]; content: string | undefined }>> => {
  const chunks = await chunkTask.triggerAndWait({
    resource,
  });

  if (!chunks.ok) {
    throw new Error("Failed to chunk");
  }

  return await logger.trace("embedding", async (span) => {
    const start = Date.now();

    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: chunks.output,
    });

    const end = Date.now();
    logger.log("Generated embeddings", {
      count: embeddings.length,
      durationMs: end - start,
    });
    span.setAttribute("embeddingsCount", embeddings.length);
    span.setAttribute("durationMs", end - start);

    return embeddings.map((e: any, i: number) => ({
      content: chunks.output[i],
      embedding: e,
    }));
  });
};

// MAIN EMBEDDING CREATION FUNCTION
const createEmbeddings = async (resource: Resource, workflowId: string) => {
  return logger.trace("create-embeddings", async (span) => {
    let title = resource.type === "FILE" ? resource.fileName : resource.url;
    const start = Date.now();

    let resourceId = resource.id ?? v7();

    try {
      logger.log("Starting embedding creation", {
        resourceId,
        workflowId,
        startTime: new Date(start).toISOString(),
      });
      span.setAttribute("resourceId", resourceId);
      span.setAttribute("workflowId", workflowId);

      // GENERATE EMBEDDINGS
      const embeddings = await generateEmbeddings(resource);

      // SAVE CHUNK TO DB
      const createdChunks = await db
        .insert(chunks)
        .values(
          embeddings.map((embedding) => ({
            ...embedding,
            id: v7(),
            resourceId,
            content: embedding.content ?? "",
            workflowId,
          }))
        )
        .returning();

      await sendUpdate(resource, {
        status: "PROCESSED",
        title,
        chunks: createdChunks.length,
        fileSize: 0,
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

      await sendUpdate(resource, {
        status: "FAILED",
        title,
        chunks: 0,
        fileSize: resource.fileSize,
      });

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

export const createResourceTask = task({
  id: "create-resource",
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
            parsed.data.resources.map((resource) => {
              const id = resource.id ?? v7();

              if (resource.type === "FILE") {
                return {
                  id,
                  type: "FILE" as const,
                  url: resource.url,
                  fileName: resource.fileName,
                  mimeType: resource.mimeType,
                  fileSize: resource.fileSize,
                };
              } else if (resource.type === "LINK") {
                return {
                  id,
                  type: "LINK" as const,
                  url: resource.url,
                  fileName: resource.url,
                  mimeType: "application/octet-stream",
                  fileSize: 0,
                };
              }

              throw new Error("Invalid resource type");
            })
          )
          .returning();

        logger.log("Resources created in database", {
          count: resourcesCreated.length,
        });
        span.setAttribute("resourcesCreatedCount", resourcesCreated.length);

        // Process each resource for embeddings
        const results = await Promise.allSettled(
          resourcesCreated.map((resource) =>
            createEmbeddings(resource as Resource, parsed.data.workflowId)
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
  resource: Resource,
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
