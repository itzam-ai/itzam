import {
  generateObjectResponse,
  generateTextResponse,
} from "@itzam/server/ai/generate/text";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import {
  GenerateObjectResponseSchema,
  GenerateTextResponseSchema,
} from "../../client/schemas";
import { createErrorResponse } from "../../errors";
import { setupRunGeneration } from "../../utils";
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
        const { workflowSlug, threadId, input, attachments, contextSlugs } =
          c.req.valid("json");

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

        const startTime = Date.now();

        const { text, metadata } = await generateTextResponse(
          aiParams,
          run,
          workflow.model,
          startTime
        );

        return c.json({
          text,
          metadata,
        });
      } catch (error) {
        if (error instanceof Error && "responseBody" in error) {
          try {
            return c.json(
              createErrorResponse(500, "Unknown error", {
                context: {
                  userId: c.get("userId"),
                  workflowSlug: c.req.valid("json").workflowSlug,
                  endpoint: "/generate/text",
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
                  endpoint: "/generate/text",
                },
                providerError: error.responseBody as string,
              }),
              500
            );
          }
        }

        return c.json(
          createErrorResponse(500, "Unknown error", {
            context: {
              userId: c.get("userId"),
              workflowSlug: c.req.valid("json").workflowSlug,
              endpoint: "/generate/text",
            },
          }),
          500
        );
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
        const {
          workflowSlug,
          threadId,
          input,
          schema,
          attachments,
          contextSlugs,
        } = c.req.valid("json");

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

        const startTime = Date.now();

        const { object, metadata } = await generateObjectResponse(
          aiParams,
          run,
          workflow.model,
          startTime
        );

        return c.json({
          object,
          metadata,
        });
      } catch (error) {
        if (error instanceof Error && "responseBody" in error) {
          try {
            return c.json(
              createErrorResponse(500, "Unknown error", {
                context: {
                  userId: c.get("userId"),
                  workflowSlug: c.req.valid("json").workflowSlug,
                  endpoint: "/generate/object",
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
                  endpoint: "/generate/object",
                },
                providerError: error.responseBody as string,
              }),
              500
            );
          }
        }

        return c.json(
          createErrorResponse(500, "Unknown error", {
            context: {
              userId: c.get("userId"),
              workflowSlug: c.req.valid("json").workflowSlug,
              endpoint: "/generate/object",
            },
          }),
          500
        );
      }
    }
  );
