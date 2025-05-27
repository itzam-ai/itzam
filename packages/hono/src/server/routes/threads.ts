import { db } from "@itzam/server/db/index";
import { threads } from "@itzam/server/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { v7 } from "uuid";
import {
  CreateThreadResponseSchema,
  GetThreadResponseSchema,
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
        const { name, lookupKey } = c.req.valid("json");

        const threadId = v7();

        const [thread] = await db
          .insert(threads)
          .values({
            id: threadId,
            name,
            lookupKey: lookupKey || null,
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
        const { id } = c.req.param();

        const thread = await db.query.threads.findFirst({
          where: eq(threads.id, id),
        });

        if (!thread) {
          return c.json(
            createErrorResponse(new Error("Thread not found")),
            404
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
    "/lookup/:lookupKey",
    describeRoute({
      summary: "Get thread by lookup key",
      description: "Retrieve a thread by its lookup key",
      validateResponse: true,
      operationId: "getThreadByLookupKey",
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
        const { lookupKey } = c.req.param();

        const thread = await db.query.threads.findFirst({
          where: eq(threads.lookupKey, lookupKey),
        });

        if (!thread) {
          return c.json(
            createErrorResponse(new Error("Thread not found")),
            404
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
  );
