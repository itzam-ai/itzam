import { db } from "@itzam/server/db/index";
import { resources } from "@itzam/server/db/schema";
import { env } from "@itzam/utils/env";
import { python } from "@trigger.dev/python";
import { logger, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import type { Resource } from "./create-resource";
import { generateFileTitleForResource, getTextFromResource } from "./utils";

export const chunkTask = task({
  id: "chunk",
  maxDuration: 900,
  machine: "small-2x",
  run: async ({
    resource,
    generateEmbeddings = false,
    saveToSupabase = false,
    workflowId,
  }: {
    resource: Resource;
    generateEmbeddings?: boolean;
    saveToSupabase?: boolean;
    workflowId?: string;
  }) => {
    return logger.trace("chunk-task", async (span) => {
      // SEND TO TIKA
      const { text: textFromTika, fileSize } =
        await getTextFromResource(resource);
      const title = await generateFileTitleForResource(textFromTika, resource);

      await db
        .update(resources)
        .set({ fileSize, title })
        .where(eq(resources.id, resource.id));

      const start = Date.now();

      logger.log("Chunking text", {
        textLength: textFromTika.length,
        generateEmbeddings,
        saveToSupabase,
      });
      span.setAttribute("textLength", textFromTika.length);
      span.setAttribute("generateEmbeddings", generateEmbeddings);
      span.setAttribute("saveToSupabase", saveToSupabase);

      try {
        // Determine which Python script arguments to use
        const scriptArgs = [resource.url, resource.mimeType, env.TIKA_URL];

        // Add embeddings flag if requested
        if (generateEmbeddings) {
          scriptArgs.push("true");

          // Add Supabase saving parameters if requested
          if (saveToSupabase && workflowId) {
            scriptArgs.push(resource.id); // resource_id
            scriptArgs.push(workflowId); // workflow_id
            scriptArgs.push("true"); // save_to_db flag
          }
        }

        const result = await python.runScript(
          "./src/python/chunk.py",
          scriptArgs,
          {}
        );

        const parsed: {
          chunks: string[];
          count: number;
          embeddings?: number[][];
          embeddings_error?: string;
          save_result?: {
            success: boolean;
            chunks_saved: number;
            chunk_ids: string[];
            error?: string;
          };
          chunks_saved?: number;
          chunk_ids?: string[];
          save_error?: string;
        } = JSON.parse(result.stdout);

        const end = Date.now();
        const durationMs = end - start;

        if (generateEmbeddings) {
          // Check if embeddings were saved to Supabase
          if (saveToSupabase && parsed.save_result) {
            const saveSuccess = parsed.save_result.success;
            const chunksSaved = parsed.chunks_saved || 0;

            logger.log("Chunking with embeddings and Supabase save completed", {
              chunksCount: parsed.chunks.length,
              chunksSaved,
              saveSuccess,
              saveError: parsed.save_error,
              durationMs,
              method: saveSuccess
                ? "chonkie-openai-supabase"
                : "chonkie-openai-save-failed",
            });

            span.setAttribute("chunksCount", parsed.chunks.length);
            span.setAttribute("chunksSaved", chunksSaved);
            span.setAttribute("saveSuccess", saveSuccess);
            span.setAttribute(
              "method",
              saveSuccess
                ? "chonkie-openai-supabase"
                : "chonkie-openai-save-failed"
            );

            if (parsed.save_error) {
              span.setAttribute("saveError", parsed.save_error);
            }

            return {
              chunks: parsed.chunks,
              savedToSupabase: saveSuccess,
              chunksSaved,
              chunkIds: parsed.chunk_ids || [],
              saveError: parsed.save_error || null,
            };
          } else {
            // Regular embedding generation without Supabase saving
            const hasEmbeddings = !!parsed.embeddings;
            const embeddingsCount = parsed.embeddings?.length || 0;

            logger.log("Chunking with embeddings completed", {
              chunksCount: parsed.chunks.length,
              embeddingsCount,
              hasEmbeddings,
              embeddingsError: parsed.embeddings_error,
              durationMs,
              method: hasEmbeddings ? "chonkie-openai" : "chonkie-failed",
            });

            span.setAttribute("chunksCount", parsed.chunks.length);
            span.setAttribute("embeddingsCount", embeddingsCount);
            span.setAttribute("hasEmbeddings", hasEmbeddings);
            span.setAttribute(
              "method",
              hasEmbeddings ? "chonkie-openai" : "chonkie-failed"
            );

            if (parsed.embeddings_error) {
              span.setAttribute("embeddingsError", parsed.embeddings_error);
            }

            return {
              chunks: parsed.chunks,
              embeddings: parsed.embeddings || null,
              embeddingsError: parsed.embeddings_error || null,
            };
          }
        } else {
          // Original chunking-only behavior
          logger.log("Chunking completed", {
            chunksCount: parsed.chunks.length,
            durationMs,
          });

          span.setAttribute("chunksCount", parsed.chunks.length);
          span.setAttribute("method", "chunking-only");

          return parsed.chunks;
        }
      } catch (error) {
        const end = Date.now();
        const durationMs = end - start;

        logger.error("Chunking failed", {
          error: error instanceof Error ? error.message : String(error),
          durationMs,
          generateEmbeddings,
          saveToSupabase,
        });

        span.setAttribute("error", String(error));
        span.setAttribute("durationMs", durationMs);

        throw error;
      }
    });
  },
});
