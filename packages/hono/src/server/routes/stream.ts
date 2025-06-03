import { generateTextOrObjectStream } from "@itzam/server/ai/generate/text";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { streamSSE } from "hono/streaming";
import { StreamEventSchema, StreamTextEventSchema } from "../../client/schemas";
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
      const { workflowSlug, threadId, input, attachments, contexts } =
        c.req.valid("json");

      const setup = await setupRunGeneration({
        userId,
        workflowSlug,
        threadId: threadId || null,
        input,
        attachments,
        contexts,
      });

      if ("error" in setup) {
        return c.json({ error: setup.error }, setup.status);
      }

      return streamSSE(c, async (stream) => {
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
      });
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
      const { workflowSlug, threadId, input, schema, attachments, contexts } =
        c.req.valid("json");

      const setup = await setupRunGeneration({
        userId,
        workflowSlug,
        threadId: threadId || null,
        input,
        schema,
        attachments,
        contexts,
      });

      if ("error" in setup) {
        return c.json({ error: setup.error }, setup.status);
      }

      return streamSSE(c, async (stream) => {
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
      });
    }
  );
