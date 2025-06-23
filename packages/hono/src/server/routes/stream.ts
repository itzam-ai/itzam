import { generateTextOrObjectStream } from "@itzam/server/ai/generate/text";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { streamSSE } from "hono/streaming";
import { StreamEventSchema, StreamTextEventSchema } from "../../client/schemas";
import { setupRunGeneration, createErrorResponse } from "../../utils";
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
      const { workflowSlug, threadId, input, attachments } =
        c.req.valid("json");

      try {
        const setup = await setupRunGeneration({
          userId,
          workflowSlug,
          threadId: threadId || null,
          input,
          attachments,
        });

        if ("error" in setup) {
          return c.json({ error: setup.error }, setup.status);
        }

        return streamSSE(c, async (stream) => {
          try {
            const { aiParams, run, workflow } = setup;
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
                details: streamError instanceof Error ? streamError.message : "Unknown error"
              }),
              event: "error"
            });
            
            // Don't notify Discord here - the AI library's onError callback already handles it
            console.error("Stream processing error:", streamError);
            
            // Close the stream
            await stream.close();
          }
        });
      } catch (error) {
        const errorResponse = createErrorResponse(error, {
          userId,
          workflowSlug,
          endpoint: "/stream/text"
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
      const { workflowSlug, threadId, input, schema, attachments } =
        c.req.valid("json");

      try {
        const setup = await setupRunGeneration({
          userId,
          workflowSlug,
          threadId: threadId || null,
          input,
          schema,
          attachments,
        });

        if ("error" in setup) {
          return c.json({ error: setup.error }, setup.status);
        }

        return streamSSE(c, async (stream) => {
          try {
            const { aiParams, run, workflow } = setup;
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
                details: streamError instanceof Error ? streamError.message : "Unknown error"
              }),
              event: "error"
            });
            
            // Don't notify Discord here - the AI library's onError callback already handles it
            console.error("Stream processing error:", streamError);
            
            // Close the stream
            await stream.close();
          }
        });
      } catch (error) {
        const errorResponse = createErrorResponse(error, {
          userId,
          workflowSlug,
          endpoint: "/stream/object"
        });
        return c.json(errorResponse, 500);
      }
    }
  );
