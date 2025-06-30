import { db } from "@itzam/server/db/index";
import { workflows } from "@itzam/server/db/schema";
import {
  createThread,
  getThreadById,
  getThreadRunsHistory,
  getThreadsByWorkflowSlug,
} from "@itzam/server/db/thread/actions";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import {
  CreateThreadResponseSchema,
  GetRunsByThreadResponseSchema,
  GetThreadResponseSchema,
  GetThreadsByWorkflowResponseSchema,
} from "../../client/schemas";
import { apiKeyMiddleware } from "../api-key-validator";
import { createOpenApiErrors } from "../docs";
import {
  createThreadValidator,
  getRunsByThreadParamsValidator,
  getThreadsByWorkflowParamsValidator,
  getThreadsByWorkflowQueryValidator,
} from "../validators";
import { createErrorResponse } from "../../errors";

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
      const userId = c.get("userId");
      const { name, lookupKeys, workflowSlug, contextSlugs } =
        c.req.valid("json");

      // Find the workflow by slug and userId
      const workflow = await db.query.workflows.findFirst({
        where: and(
          eq(workflows.slug, workflowSlug),
          eq(workflows.userId, userId),
          eq(workflows.isActive, true)
        ),
      });

      if (!workflow) {
        const userWorkflows = await db.query.workflows.findMany({
          where: and(
            eq(workflows.userId, userId),
            eq(workflows.isActive, true)
          ),
        });

        return c.json(
          createErrorResponse(404, "Workflow not found", {
            possibleValues: userWorkflows.map((w) => w.slug),
          }),
          404
        );
      }

      const thread = await createThread({
        workflowId: workflow.id,
        lookupKeys,
        name,
        contextSlugs,
      });

      if (!thread) {
        return c.json(createErrorResponse(500, "Failed to create thread"), 500);
      }

      return c.json({
        id: thread.id,
        name: thread.name,
        lookupKeys: thread.lookupKeys,
        contextSlugs: thread.contextSlugs,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      });
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
    getThreadsByWorkflowParamsValidator,
    getThreadsByWorkflowQueryValidator,
    async (c) => {
      const userId = c.get("userId");
      const { workflowSlug } = c.req.valid("param");
      const { lookupKeys } = c.req.valid("query");

      const threads = await getThreadsByWorkflowSlug(workflowSlug, userId, {
        lookupKeys,
      });

      return c.json({
        threads: threads.map((thread) => ({
          id: thread.id,
          name: thread.name,
          lookupKeys: thread.lookupKeys.map((key) => key.lookupKey),
          contextSlugs: thread.threadContexts.map(
            (context) => context.context.slug
          ),
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
        })),
      });
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
    getRunsByThreadParamsValidator,
    async (c) => {
      const userId = c.get("userId");
      const { threadId } = c.req.valid("param");

      const runs = await getThreadRunsHistory(threadId, userId);

      const response = {
        runs: runs.map((run) => ({
          id: run.id,
          origin: run.origin,
          status: run.status,
          input: run.input,
          output: run.output ?? "",
          prompt: run.prompt,
          inputTokens: run.inputTokens,
          outputTokens: run.outputTokens,
          cost: run.cost,
          durationInMs: run.durationInMs,
          threadId: run.threadId ?? null,
          model: {
            name: run.model?.name ?? "",
            tag: run.model?.tag ?? "",
          },
          attachments: run.attachments.map((attachment) => ({
            id: attachment.id,
            url: attachment.url,
            mimeType: attachment.mimeType,
          })),
          knowledge: run.runResources.map((resource) => ({
            id: resource.resource.id,
            title: resource.resource.title,
            url: resource.resource.url,
            type: resource.resource.type,
            // if the resource is from a context, return the context object
            context: resource.resource.context
              ? {
                  id: resource.resource.context.id,
                  slug: resource.resource.context.slug,
                  name: resource.resource.context.name,
                }
              : null,
          })),
          workflowId: run.workflowId ?? "",
          createdAt: run.createdAt.toISOString(),
        })),
      };

      return c.json(response);
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
      const userId = c.get("userId");
      const { id } = c.req.param();

      const thread = await getThreadById(id, userId);

      if (!thread) {
        return c.json(createErrorResponse(404, "Thread not found"), 404);
      }

      return c.json(thread);
    }
  );
