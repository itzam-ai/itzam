import { db } from "@itzam/server/db/index";
import { contexts, workflows, resources, resourceContexts } from "@itzam/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { v7 } from "uuid";
import {
  CreateContextResponseSchema,
  GetContextResponseSchema,
  GetContextsByWorkflowResponseSchema,
  UpdateContextResponseSchema,
} from "../../client/schemas";
import { createErrorResponse } from "../../utils";
import { apiKeyMiddleware } from "../api-key-validator";
import { createOpenApiErrors } from "../docs";
import { createContextValidator, updateContextValidator } from "../validators";


export const contextsRoute = new Hono()
  .use(apiKeyMiddleware)
  
  // Create context
  .post(
    "/",
    describeRoute({
      summary: "Create context",
      description: "Create a new context for a workflow",
      validateResponse: true,
      operationId: "createContext",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(CreateContextResponseSchema),
          },
        },
        description: "Successfully created context",
      }),
    }),
    createContextValidator,
    async (c) => {
      try {
        const { name, description, workflowSlug } = c.req.valid("json");

        // Find the workflow by slug
        const workflow = await db.query.workflows.findFirst({
          where: eq(workflows.slug, workflowSlug),
        });

        if (!workflow) {
          return c.json(
            createErrorResponse(new Error("Workflow not found")),
            404
          );
        }

        // Generate slug from name
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if slug already exists for this workflow
        const existingContext = await db.query.contexts.findFirst({
          where: and(
            eq(contexts.workflowId, workflow.id),
            eq(contexts.slug, slug)
          ),
        });

        if (existingContext) {
          return c.json(
            createErrorResponse(new Error("Context with this name already exists")),
            400
          );
        }

        const contextId = v7();
        const now = new Date();

        const [newContext] = await db
          .insert(contexts)
          .values({
            id: contextId,
            name,
            slug,
            description: description || null,
            workflowId: workflow.id,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!newContext) {
          return c.json(
            createErrorResponse(new Error("Failed to create context")),
            500
          );
        }

        return c.json({
          ...newContext,
          createdAt: newContext.createdAt.toISOString(),
          updatedAt: newContext.updatedAt.toISOString(),
          resources: [],
        });
      } catch (error) {
        console.error("Error creating context:", error);
        return c.json(
          createErrorResponse(new Error("Failed to create context")),
          500
        );
      }
    }
  )

  // Get contexts for a workflow
  .get(
    "/workflow/:workflowSlug",
    describeRoute({
      summary: "Get contexts for workflow",
      description: "Get all contexts associated with a workflow",
      validateResponse: true,
      operationId: "getContextsByWorkflow",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GetContextsByWorkflowResponseSchema),
          },
        },
        description: "Successfully retrieved contexts",
      }),
    }),
    async (c) => {
      try {
        const workflowSlug = c.req.param("workflowSlug");

        // Find the workflow by slug
        const workflow = await db.query.workflows.findFirst({
          where: eq(workflows.slug, workflowSlug),
        });

        if (!workflow) {
          return c.json(
            createErrorResponse(new Error("Workflow not found")),
            404
          );
        }

        const contextList = await db.query.contexts.findMany({
          where: eq(contexts.workflowId, workflow.id),
        });

        const contextsWithResources = await Promise.all(
          contextList.map(async (context) => {
            const contextResources = await db
              .select({
                id: resources.id,
                title: resources.title,
                type: resources.type,
                url: resources.url,
                status: resources.status,
              })
              .from(resourceContexts)
              .innerJoin(resources, eq(resourceContexts.resourceId, resources.id))
              .where(eq(resourceContexts.contextId, context.id));

            return {
              ...context,
              createdAt: context.createdAt.toISOString(),
              updatedAt: context.updatedAt.toISOString(),
              resources: contextResources,
            };
          })
        );

        return c.json({ contexts: contextsWithResources });
      } catch (error) {
        console.error("Error fetching contexts:", error);
        return c.json(
          createErrorResponse(new Error("Failed to fetch contexts")),
          500
        );
      }
    }
  )

  // Get context by ID or slug
  .get(
    "/:identifier",
    describeRoute({
      summary: "Get context by identifier",
      description: "Get a specific context by its ID or slug",
      validateResponse: true,
      operationId: "getContext",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(GetContextResponseSchema),
          },
        },
        description: "Successfully retrieved context",
      }),
    }),
    async (c) => {
      try {
        const identifier = c.req.param("identifier");

        // Try to find by ID first, then by slug
        let context = await db.query.contexts.findFirst({
          where: eq(contexts.id, identifier),
        });

        if (!context) {
          context = await db.query.contexts.findFirst({
            where: eq(contexts.slug, identifier),
          });
        }

        if (!context) {
          return c.json(
            createErrorResponse(new Error("Context not found")),
            404
          );
        }

        // Get resources
        const contextResources = await db
          .select({
            id: resources.id,
            title: resources.title,
            type: resources.type,
            url: resources.url,
            status: resources.status,
          })
          .from(resourceContexts)
          .innerJoin(resources, eq(resourceContexts.resourceId, resources.id))
          .where(eq(resourceContexts.contextId, context.id));

        return c.json({
          ...context,
          createdAt: context.createdAt.toISOString(),
          updatedAt: context.updatedAt.toISOString(),
          resources: contextResources,
        });
      } catch (error) {
        console.error("Error fetching context:", error);
        return c.json(
          createErrorResponse(new Error("Failed to fetch context")),
          500
        );
      }
    }
  )

  // Update context
  .patch(
    "/:id",
    describeRoute({
      summary: "Update context",
      description: "Update context details or manage its resources",
      validateResponse: true,
      operationId: "updateContext",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(UpdateContextResponseSchema),
          },
        },
        description: "Successfully updated context",
      }),
    }),
    updateContextValidator,
    async (c) => {
      try {
        const contextId = c.req.param("id");
        const data = c.req.valid("json");

        // Verify context exists
        const context = await db.query.contexts.findFirst({
          where: eq(contexts.id, contextId),
        });

        if (!context) {
          return c.json(
            createErrorResponse(new Error("Context not found")),
            404
          );
        }

        // Update context details if provided
        if (data.name || data.description !== undefined) {
          const updateData: any = {
            updatedAt: new Date(),
          };

          if (data.name) {
            updateData.name = data.name;
            updateData.slug = data.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
          }

          if (data.description !== undefined) {
            updateData.description = data.description || null;
          }

          await db
            .update(contexts)
            .set(updateData)
            .where(eq(contexts.id, contextId));
        }

        // Handle resource updates
        if (data.resourceIds) {
          // Remove existing associations
          await db
            .delete(resourceContexts)
            .where(eq(resourceContexts.contextId, contextId));

          // Add new associations
          if (data.resourceIds.length > 0) {
            const associations = data.resourceIds.map((resourceId) => ({
              id: v7(),
              resourceId,
              contextId,
              createdAt: new Date(),
            }));

            await db.insert(resourceContexts).values(associations);

            // Remove knowledge associations from resources
            await db
              .update(resources)
              .set({ knowledgeId: null })
              .where(inArray(resources.id, data.resourceIds));
          }
        }

        // Fetch updated context with resources
        const updatedContext = await db.query.contexts.findFirst({
          where: eq(contexts.id, contextId),
        });

        if (!updatedContext) {
          return c.json(
            createErrorResponse(new Error("Failed to fetch updated context")),
            500
          );
        }

        const contextResources = await db
          .select({
            id: resources.id,
            title: resources.title,
            type: resources.type,
            url: resources.url,
            status: resources.status,
          })
          .from(resourceContexts)
          .innerJoin(resources, eq(resourceContexts.resourceId, resources.id))
          .where(eq(resourceContexts.contextId, contextId));

        return c.json({
          ...updatedContext,
          createdAt: updatedContext.createdAt.toISOString(),
          updatedAt: updatedContext.updatedAt.toISOString(),
          resources: contextResources,
        });
      } catch (error) {
        console.error("Error updating context:", error);
        return c.json(
          createErrorResponse(new Error("Failed to update context")),
          500
        );
      }
    }
  );