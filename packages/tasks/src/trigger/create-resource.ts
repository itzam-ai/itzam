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

// MULTIPLE EMBEDDINGS (using Chonkie's OpenAIEmbeddings with Supabase saving)
const generateEmbeddings = async (
  resource: Resource,
  workflowId: string
): Promise<
  | Array<{ embedding: number[]; content: string | undefined }>
  | { savedToSupabase: boolean; chunksSaved: number; chunkIds: string[] }
> => {
  return await logger.trace("embedding", async (span) => {
    const start = Date.now();

    try {
      // Try using Chonkie's OpenAIEmbeddings with direct Supabase saving
      const result = await chunkTask.triggerAndWait({
        resource,
        generateEmbeddings: true,
        saveToSupabase: true,
        workflowId,
      });

      if (!result.ok) {
        throw new Error("Failed to chunk with embeddings and Supabase save");
      }

      const output = result.output;

      // Check if result indicates successful Supabase save
      if (typeof output === "object" && "savedToSupabase" in output) {
        if (output.savedToSupabase) {
          // Success with direct Supabase saving
          const end = Date.now();
          logger.log(
            "Generated and saved embeddings using Chonkie + Supabase",
            {
              chunksSaved: output.chunksSaved,
              durationMs: end - start,
            }
          );
          span.setAttribute("chunksSaved", output.chunksSaved);
          span.setAttribute("durationMs", end - start);
          span.setAttribute("method", "chonkie-openai-supabase");

          return {
            savedToSupabase: true,
            chunksSaved: output.chunksSaved,
            chunkIds: output.chunkIds,
          };
        } else {
          // Save failed, fall back to TypeScript approach
          throw new Error(`Supabase save failed: ${output.saveError}`);
        }
      }

      // Check if result has embeddings (fallback to regular embedding generation)
      if (
        typeof output === "object" &&
        "chunks" in output &&
        "embeddings" in output
      ) {
        const { chunks, embeddings, embeddingsError } = output;

        if (embeddings && embeddings.length === chunks.length) {
          // Success with Chonkie OpenAIEmbeddings (no Supabase save)
          const end = Date.now();
          logger.log("Generated embeddings using Chonkie OpenAIEmbeddings", {
            count: embeddings.length,
            durationMs: end - start,
          });
          span.setAttribute("embeddingsCount", embeddings.length);
          span.setAttribute("durationMs", end - start);
          span.setAttribute("method", "chonkie-openai");

          return embeddings.map((embedding, i) => ({
            content: chunks[i],
            embedding,
          }));
        } else {
          // Log embedding error if available
          if (embeddingsError) {
            logger.warn("Chonkie embeddings failed, falling back to ai SDK", {
              error: embeddingsError,
            });
          }
          throw new Error("Embeddings generation failed in Chonkie");
        }
      } else {
        throw new Error("Unexpected result format from chunk task");
      }
    } catch (error) {
      // Fallback to original approach using ai SDK
      logger.warn("Falling back to ai SDK for embeddings", {
        error: error instanceof Error ? error.message : String(error),
      });

      const chunksResult = await chunkTask.triggerAndWait({
        resource,
        generateEmbeddings: false,
      });

      if (!chunksResult.ok) {
        throw new Error("Failed to chunk");
      }

      // chunksResult.output should be string[] when generateEmbeddings is false
      const chunks = chunksResult.output as string[];

      const { embeddings } = await embedMany({
        model: EMBEDDING_MODEL,
        values: chunks,
      });

      const end = Date.now();
      logger.log("Generated embeddings using ai SDK fallback", {
        count: embeddings.length,
        durationMs: end - start,
      });
      span.setAttribute("embeddingsCount", embeddings.length);
      span.setAttribute("durationMs", end - start);
      span.setAttribute("method", "ai-sdk-fallback");

      return embeddings.map((e: any, i: number) => ({
        content: chunks[i],
        embedding: e,
      }));
    }
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
      const embeddings = await generateEmbeddings(resource, workflowId);

      // Check if embeddings were saved directly to Supabase
      if (typeof embeddings === "object" && "savedToSupabase" in embeddings) {
        // Embeddings were saved directly from Python
        await sendUpdate(resource, {
          status: "PROCESSED",
          title,
          chunks: embeddings.chunksSaved,
          fileSize: 0,
        });

        logger.log("Chunks saved directly to Supabase from Python", {
          resourceId: resource.id,
          chunksCount: embeddings.chunksSaved,
        });
        span.setAttribute("chunksCount", embeddings.chunksSaved);
        span.setAttribute("savedToSupabase", true);

        await db
          .update(resources)
          .set({ status: "PROCESSED" })
          .where(eq(resources.id, resource.id));

        const end = Date.now();
        logger.log("Embedding creation completed (Supabase direct save)", {
          resourceId: resource.id,
          durationMs: end - start,
          endTime: new Date(end).toISOString(),
        });
        span.setAttribute("durationMs", end - start);
        span.setAttribute("endTime", new Date(end).toISOString());

        return {
          resourceId: resource.id,
          title,
          chunksCount: embeddings.chunksSaved,
          status: "PROCESSED" as const,
          savedToSupabase: true,
        };
      } else {
        // Traditional flow: save chunks via TypeScript
        const embeddingArray = embeddings as Array<{
          embedding: number[];
          content: string | undefined;
        }>;

        // SAVE CHUNK TO DB
        const createdChunks = await db
          .insert(chunks)
          .values(
            embeddingArray.map((embedding) => ({
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

        logger.log("Chunks created successfully via TypeScript", {
          resourceId: resource.id,
          chunksCount: createdChunks.length,
        });
        span.setAttribute("chunksCount", createdChunks.length);
        span.setAttribute("savedToSupabase", false);

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
          savedToSupabase: false,
        };
      }
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
