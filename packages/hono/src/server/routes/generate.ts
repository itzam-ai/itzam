import { generateTextResponse } from "@itzam/server/ai/generate/text";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import {
  GenerateObjectResponseSchema,
  GenerateTextResponseSchema,
} from "../../client/schemas";
import { createErrorResponse, setupRunGeneration } from "../../utils";
import { apiKeyMiddleware } from "../api-key-validator";
import { createOpenApiErrors } from "../docs";
import {
  objectCompletionValidator,
  textCompletionValidator,
} from "../validators";

export const generateRoute = new Hono()
  .use(apiKeyMiddleware)
  .post(
    "/text",
    describeRoute({
      summary: "Generate text",
      description: "Generate text for a specific workflow",
      validateResponse: true,
      operationId: "generateText",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GenerateTextResponseSchema),
          },
        },
        description:
          "Successfully generated content (we also return the run ID in the header X-Run-ID)",
      }),
    }),
    textCompletionValidator,
    async (c) => {
      try {
        const userId = c.get("userId");
        const { workflowSlug, threadId, input, attachments } =
          c.req.valid("json");

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

        const { aiParams, run, workflow } = setup;
        const startTime = Date.now();

        const result = await generateTextResponse(
          aiParams,
          run,
          workflow.model,
          startTime
        );

        return c.json({
          text: result.output.text,
          metadata: result.metadata,
        });
      } catch (error) {
        const userId = c.get("userId");
        const body = c.req.valid("json");
        return c.json(createErrorResponse(error, {
          userId,
          workflowSlug: body.workflowSlug,
          endpoint: "/generate/text"
        }), 500);
      }
    }
  )
  .post(
    "/object",
    describeRoute({
      summary: "Generate object",
      description: "Generate a structured object for a specific workflow",
      operationId: "generateObject",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GenerateObjectResponseSchema),
          },
        },
        description:
          "Successfully generated object (we also return the run ID in the header X-Run-ID)",
      }),
    }),
    objectCompletionValidator,
    async (c) => {
      try {
        const userId = c.get("userId");
        const { workflowSlug, threadId, input, schema, attachments } =
          c.req.valid("json");

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

        const { aiParams, run, workflow } = setup;
        const startTime = Date.now();

        const result = await generateTextResponse(
          aiParams,
          run,
          workflow.model,
          startTime,
          "object"
        );

        return c.json({
          object: result.output,
          metadata: result.metadata,
        });
      } catch (error) {
        const userId = c.get("userId");
        const body = c.req.valid("json");
        return c.json(createErrorResponse(error, {
          userId,
          workflowSlug: body.workflowSlug,
          endpoint: "/generate/object"
        }), 500);
      }
    }
  );
