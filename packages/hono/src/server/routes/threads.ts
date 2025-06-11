import { db } from "@itzam/server/db/index";
import { threads, workflows } from "@itzam/server/db/schema";
import {
  getThreadById,
  getThreadRunsHistory,
  getThreadsByWorkflowSlug,
} from "@itzam/server/db/thread/actions";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { validator } from "hono/validator";
import { v7 } from "uuid";
import { z } from "zod";
import {
  CreateThreadResponseSchema,
  GetRunsByThreadParamsSchema,
  GetRunsByThreadResponseSchema,
  GetThreadResponseSchema,
  GetThreadsByWorkflowParamsSchema,
  GetThreadsByWorkflowResponseSchema,
} from "../../client/schemas";
import { createErrorResponse } from "../../utils";
import { apiKeyMiddleware } from "../api-key-validator";
import { createOpenApiErrors } from "../docs";
import { createThreadValidator } from "../validators";

export const threadsRoute = new Hono()
  .use(apiKeyMiddleware)
  .post(
    "/",
    describeRoute({
      summary: "Create thread",
      description: "Create a new thread for continuous messaging",
      validateResponse: true,
      operationId: "createThread",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(CreateThreadResponseSchema),
          },
        },
        description: "Successfully created thread",
      }),
    }),
    createThreadValidator,
    async (c) => {
      try {
        const { name, lookupKey, workflowSlug } = c.req.valid("json");

        // Find the workflow by slug and userId
        const workflow = await db.query.workflows.findFirst({
          where: eq(workflows.slug, workflowSlug),
        });

        if (!workflow) {
          return c.json(
            createErrorResponse(new Error("Workflow not found")),
            404
          );
        }

        const threadId = `thread_${v7()}`;
        const threadName = name || `Thread ${threadId.slice(-10)}`;

        const [thread] = await db
          .insert(threads)
          .values({
            id: threadId,
            name: threadName,
            lookupKey: lookupKey || null,
            workflowId: workflow.id,
          })
          .returning();

        if (!thread) {
          return c.json(
            createErrorResponse(new Error("Failed to create thread")),
            500
          );
        }

        return c.json({
          id: thread.id,
          name: thread.name,
          lookupKey: thread.lookupKey,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
        });
      } catch (error) {
        return c.json(createErrorResponse(error), 500);
      }
    }
  )
  .get(
    "/workflow/:workflowSlug",
    describeRoute({
      summary: "Get threads by workflow",
      description:
        "Retrieve all threads for a specific workflow, optionally filtered by lookup key",
      validateResponse: true,
      operationId: "getThreadsByWorkflow",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GetThreadsByWorkflowResponseSchema),
          },
        },
        description: "Successfully retrieved threads",
      }),
    }),
    validator("param", (value, c) => {
      const parsed = GetThreadsByWorkflowParamsSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("Invalid parameters", 400);
      }
      return parsed.data;
    }),
    validator("query", (value, c) => {
      const querySchema = z.object({
        lookupKey: z.string().optional(),
      });
      const parsed = querySchema.safeParse(value);
      if (!parsed.success) {
        return c.text("Invalid query parameters", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { workflowSlug } = c.req.valid("param");
        const { lookupKey } = c.req.valid("query");

        const threads = await getThreadsByWorkflowSlug(workflowSlug, userId, {
          lookupKey,
        });

        return c.json({
          threads: threads.map((thread) => ({
            id: thread.id,
            name: thread.name,
            lookupKey: thread.lookupKey,
            createdAt: thread.createdAt.toISOString(),
            updatedAt: thread.updatedAt.toISOString(),
          })),
        });
      } catch (error) {
        return c.json(createErrorResponse(error), 500);
      }
    }
  )
  .get(
    "/:threadId/runs",
    describeRoute({
      summary: "Get runs by thread",
      description: "Retrieve all runs for a specific thread",
      validateResponse: true,
      operationId: "getRunsByThread",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GetRunsByThreadResponseSchema),
          },
        },
        description: "Successfully retrieved thread runs",
      }),
    }),
    validator("param", (value, c) => {
      const parsed = GetRunsByThreadParamsSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("Invalid parameters", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { threadId } = c.req.valid("param");

        const runs = await getThreadRunsHistory(threadId, userId);

        return c.json({
          runs: runs.map((run) => ({
            id: run.id,
            input: run.input,
            output: run.output || "",
            createdAt: run.createdAt.toISOString(),
            model: {
              name: run.model?.name || "",
              tag: run.model?.tag || "",
            },
          })),
        });
      } catch (error) {
        return c.json(createErrorResponse(error), 500);
      }
    }
  )
  .get(
    "/:id",
    describeRoute({
      summary: "Get thread by ID",
      description: "Retrieve a thread by its ID",
      validateResponse: true,
      operationId: "getThreadById",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GetThreadResponseSchema),
          },
        },
        description: "Successfully retrieved thread",
      }),
    }),
    async (c) => {
      try {
        const userId = c.get("userId");
        const { id } = c.req.param();

        const thread = await getThreadById(id, userId);

        if (!thread) {
          return c.json(
            createErrorResponse(new Error("Thread not found")),
            404
          );
        }

        return c.json(thread);
      } catch (error) {
        return c.json(createErrorResponse(error), 500);
      }
    }
  );
