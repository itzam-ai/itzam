import {
  generateObjectResponse,
  generateTextResponse,
} from "@itzam/server/ai/generate/text";
import { env } from "@itzam/utils/env";
import { Client } from "@upstash/qstash";
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
  generateObjectCompletionValidator,
  generateTextCompletionValidator,
} from "../validators";

const client = new Client({ token: process.env.QSTASH_TOKEN! });

export const generateRoute = new Hono()
  .use(apiKeyMiddleware)
  .post(
    "/text",
    describeRoute({
      summary: "Generate text",
      description: "Generate text for a specific workflow",
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
    generateTextCompletionValidator,
    async (c) => {
      try {
        const userId = c.get("userId");
        const params = c.req.valid("json");

        const { error, status, possibleValues, aiParams, run, workflow } =
          await setupRunGeneration({
            userId,
            workflowSlug: params.workflowSlug,
            threadId: "threadId" in params ? params.threadId || null : null,
            input: params.input,
            attachments: params.attachments,
            contextSlugs: params.contextSlugs,
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
        if ("type" in params && params.type === "event") {
          await client.publishJSON({
            url: `${env.NEXT_PUBLIC_APP_URL}/api/events`,
            body: {
              run,
              workflow,
              startTime,
              input: params.input,
              callback: {
                url: params.callback.url,
                headers: params.callback.headers,
                customProperties: params.callback.customProperties,
              },
            },
          });

          return c.json(
            {
              runId: run.id,
              message: "Event queued",
            },
            200
          );
        }

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
    generateObjectCompletionValidator,
    async (c) => {
      try {
        const userId = c.get("userId");
        const params = c.req.valid("json");
        const threadId = "threadId" in params ? params.threadId || null : null;
        const { error, status, possibleValues, aiParams, run, workflow } =
          await setupRunGeneration({
            userId,
            workflowSlug: params.workflowSlug,
            threadId,
            input: params.input,
            schema: params.schema,
            attachments: params.attachments,
            contextSlugs: params.contextSlugs,
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
        if ("type" in params && params.type === "event") {
          await client.publishJSON({
            url: `${env.NEXT_PUBLIC_APP_URL}/api/events`,
            body: {
              schema: params.schema,
              run,
              workflow,
              startTime,
              input: params.input,
              callback: {
                url: params.callback.url,
                headers: params.callback.headers,
                customProperties: params.callback.customProperties,
              },
            },
          });

          return c.json(
            {
              runId: run.id,
              message: "Event queued",
            },
            200
          );
        }

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
