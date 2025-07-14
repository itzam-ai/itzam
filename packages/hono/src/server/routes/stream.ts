import { generateTextOrObjectStream } from "@itzam/server/ai/generate/text";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { streamSSE } from "hono/streaming";
import { StreamEventSchema, StreamTextEventSchema } from "../../client/schemas";
import { createErrorResponse } from "../../errors";
import { setupRunGeneration } from "../../utils";
import { apiKeyMiddleware } from "../api-key-validator";
import { createOpenApiErrors } from "../docs";
import {
  objectCompletionValidator,
  textCompletionValidator,
} from "../validators";

export const streamRoute = new Hono()
  .use(apiKeyMiddleware)
  .post(
    "/text",
    describeRoute({
      summary: "Stream text",
      description:
        "Stream text generation for a specific workflow (we strongly recommend using the SDK for this)",
      operationId: "streamText",
      externalDocs: {
        url: "https://docs.itz.am/sdks/javascript#stream-text",
        description: "How to parse the response",
      },
      responses: createOpenApiErrors({
        content: {
          "text/event-stream": {
            schema: resolver(StreamTextEventSchema),
          },
        },
        description: "Successfully streaming content",
      }),
    }),
    textCompletionValidator,
    async (c) => {
      const userId = c.get("userId");
      const { workflowSlug, threadId, input, attachments, contextSlugs } =
        c.req.valid("json");

      try {
        const { error, status, possibleValues, aiParams, run, workflow } =
          await setupRunGeneration({
            userId,
            workflowSlug,
            threadId: threadId || null,
            input,
            attachments,
            contextSlugs,
          });

        if (error || status) {
          return c.json(
            createErrorResponse(status, error, {
              possibleValues,
            }),
            status
          );
        }

        return streamSSE(c, async (stream) => {
          try {
            const startTime = Date.now();
            await generateTextOrObjectStream(
              aiParams,
              run,
              workflow.model,
              startTime,
              stream,
              "text"
            );
          } catch (streamError) {
            // Send error event to stream
            await stream.writeSSE({
              data: JSON.stringify({
                error: "Stream processing failed",
                details:
                  streamError instanceof Error
                    ? streamError.message
                    : "Unknown error",
              }),
              event: "error",
            });

            // Don't notify Discord here - the AI library's onError callback already handles it
            console.error("Stream processing error:", streamError);

            // Close the stream
            await stream.close();
          }
        });
      } catch (error) {
        if (error instanceof Error && "responseBody" in error) {
          try {
            return c.json(
              createErrorResponse(500, "Unknown error", {
                context: {
                  userId: c.get("userId"),
                  workflowSlug: c.req.valid("json").workflowSlug,
                  endpoint: "/stream/text",
                },
                providerError: JSON.parse(error.responseBody as string),
              }),
              500
            );
          } catch {
            return c.json(
              createErrorResponse(500, "Unknown error", {
                context: {
                  userId: c.get("userId"),
                  workflowSlug: c.req.valid("json").workflowSlug,
                  endpoint: "/stream/text",
                },
                providerError: error.responseBody as string,
              }),
              500
            );
          }
        }

        const errorResponse = createErrorResponse(500, "Unknown error", {
          context: {
            userId,
            workflowSlug,
            endpoint: "/stream/text",
          },
        });
        return c.json(errorResponse, 500);
      }
    }
  )
  .post(
    "/object",
    describeRoute({
      summary: "Stream object",
      description:
        "Stream object generation for a specific workflow (we strongly recommend using the SDK for this)",
      operationId: "streamObject",
      externalDocs: {
        url: "https://docs.itz.am/sdks/javascript#stream-object",
        description: "How to parse the response",
      },
      responses: createOpenApiErrors({
        content: {
          "text/event-stream": {
            schema: resolver(StreamEventSchema), // Use resolver for consistency
          },
        },
        description: "Successfully streaming content",
      }),
    }),
    objectCompletionValidator,
    async (c) => {
      const userId = c.get("userId");
      const {
        workflowSlug,
        threadId,
        input,
        schema,
        attachments,
        contextSlugs,
      } = c.req.valid("json");

      try {
        const { error, status, possibleValues, aiParams, run, workflow } =
          await setupRunGeneration({
            userId,
            workflowSlug,
            threadId: threadId || null,
            input,
            schema,
            attachments,
            contextSlugs,
          });

        if (error || status) {
          return c.json(
            createErrorResponse(status, error, {
              possibleValues,
            }),
            status
          );
        }

        return streamSSE(c, async (stream) => {
          try {
            const startTime = Date.now();
            await generateTextOrObjectStream(
              aiParams,
              run,
              workflow.model,
              startTime,
              stream,
              "object"
            );
          } catch (streamError) {
            // Send error event to stream
            await stream.writeSSE({
              data: JSON.stringify({
                error: "Stream processing failed",
                details:
                  streamError instanceof Error
                    ? streamError.message
                    : "Unknown error",
              }),
              event: "error",
            });

            // Don't notify Discord here - the AI library's onError callback already handles it
            console.error("Stream processing error:", streamError);

            // Close the stream
            await stream.close();
          }
        });
      } catch (error) {
        if (error instanceof Error && "responseBody" in error) {
          try {
            return c.json(
              createErrorResponse(500, "Unknown error", {
                context: {
                  userId: c.get("userId"),
                  workflowSlug: c.req.valid("json").workflowSlug,
                  endpoint: "/stream/object",
                },
                providerError: JSON.parse(error.responseBody as string),
              }),
              500
            );
          } catch {
            return c.json(
              createErrorResponse(500, "Unknown error", {
                context: {
                  userId: c.get("userId"),
                  workflowSlug: c.req.valid("json").workflowSlug,
                  endpoint: "/stream/object",
                },
                providerError: error.responseBody as string,
              }),
              500
            );
          }
        }

        const errorResponse = createErrorResponse(500, "Unknown error", {
          context: {
            userId,
            workflowSlug,
            endpoint: "/stream/object",
          },
        });
        return c.json(errorResponse, 500);
      }
    }
  );
