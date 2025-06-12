import { db } from "@itzam/server/db/index";
import { contexts, workflows, resources, resourceContexts } from "@itzam/server/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { v7 } from "uuid";
import {
  CreateContextResponseSchema,
  DeleteContextResponseSchema,
  GetContextResponseSchema,
  GetContextsByWorkflowResponseSchema,
  UpdateContextResponseSchema,
} from "../../client/schemas";
import { createErrorResponse } from "../../utils";
import { apiKeyMiddleware } from "../api-key-validator";
import { createOpenApiErrors } from "../docs";
import { createContextValidator, deleteContextValidator, updateContextValidator } from "../validators";


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

        // Fetch contexts with their resources in a single query
        const contextList = await db.query.contexts.findMany({
          where: eq(contexts.workflowId, workflow.id),
          with: {
            resourceContexts: {
              with: {
                resource: {
                  columns: {
                    id: true,
                    title: true,
                    type: true,
                    url: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        // Transform the data to match the expected format
        const contextsWithResources = contextList.map((context) => ({
          ...context,
          createdAt: context.createdAt.toISOString(),
          updatedAt: context.updatedAt.toISOString(),
          resources: context.resourceContexts?.map((rc) => rc.resource) || [],
          resourceContexts: undefined, // Remove the intermediate relation data
        }));

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

        // Try to find by ID or slug with resources in a single query
        const context = await db.query.contexts.findFirst({
          where: or(
            eq(contexts.id, identifier),
            eq(contexts.slug, identifier)
          ),
          with: {
            resourceContexts: {
              with: {
                resource: {
                  columns: {
                    id: true,
                    title: true,
                    type: true,
                    url: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!context) {
          return c.json(
            createErrorResponse(new Error("Context not found")),
            404
          );
        }

        return c.json({
          ...context,
          createdAt: context.createdAt.toISOString(),
          updatedAt: context.updatedAt.toISOString(),
          resources: context.resourceContexts?.map((rc) => rc.resource) || [],
          resourceContexts: undefined, // Remove the intermediate relation data
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

        // Fetch updated context with resources in a single query
        const updatedContext = await db.query.contexts.findFirst({
          where: eq(contexts.id, contextId),
          with: {
            resourceContexts: {
              with: {
                resource: {
                  columns: {
                    id: true,
                    title: true,
                    type: true,
                    url: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!updatedContext) {
          return c.json(
            createErrorResponse(new Error("Failed to fetch updated context")),
            500
          );
        }

        return c.json({
          ...updatedContext,
          createdAt: updatedContext.createdAt.toISOString(),
          updatedAt: updatedContext.updatedAt.toISOString(),
          resources: updatedContext.resourceContexts?.map((rc) => rc.resource) || [],
          resourceContexts: undefined, // Remove the intermediate relation data
        });
      } catch (error) {
        console.error("Error updating context:", error);
        return c.json(
          createErrorResponse(new Error("Failed to update context")),
          500
        );
      }
    }
  )

  // Delete context
  .delete(
    "/:id",
    describeRoute({
      summary: "Delete context",
      description: "Delete a context and move its resources back to knowledge",
      validateResponse: true,
      operationId: "deleteContext",
      responses: createOpenApiErrors({
        content: {
          "application/json": {
            schema: resolver(DeleteContextResponseSchema),
          },
        },
        description: "Successfully deleted context",
      }),
    }),
    deleteContextValidator,
    async (c) => {
      try {
        const { id } = c.req.valid("param");

        // Get the context to verify it exists
        const context = await db.query.contexts.findFirst({
          where: eq(contexts.id, id),
          columns: { id: true, workflowId: true },
        });

        if (!context) {
          return c.json(
            createErrorResponse(new Error("Context not found")),
            404
          );
        }

        // Get all resources associated with this context
        const associatedResources = await db.query.resourceContexts.findMany({
          where: eq(resourceContexts.contextId, id),
          columns: { resourceId: true },
        });

        // Get the workflow's knowledge ID for moving resources back
        const workflow = await db.query.workflows.findFirst({
          where: eq(workflows.id, context.workflowId),
          columns: { knowledgeId: true },
        });

        // Delete all resource-context associations
        await db.delete(resourceContexts)
          .where(eq(resourceContexts.contextId, id));

        // Move resources back to knowledge if workflow has knowledge
        if (workflow?.knowledgeId && associatedResources.length > 0) {
          const resourceIds = associatedResources.map(rc => rc.resourceId);
          await db.update(resources)
            .set({ knowledgeId: workflow.knowledgeId })
            .where(inArray(resources.id, resourceIds));
        }

        // Delete the context
        await db.delete(contexts)
          .where(eq(contexts.id, id));

        return c.json({
          id,
          deleted: true,
        });
      } catch (error) {
        console.error("Error deleting context:", error);
        return c.json(
          createErrorResponse(new Error("Failed to delete context")),
          500
        );
      }
    }
  );