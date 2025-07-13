"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import "server-only";
import { v7 as uuidv7 } from "uuid";
import { sendDiscordNotification } from "../../discord/actions";
import { protectedProcedure } from "../../procedures";
import { getCustomerSubscriptionStatus } from "../billing/actions";
import { db } from "../index";
import {
  contexts,
  knowledge,
  models,
  modelSettings,
  resources,
  workflows,
} from "../schema";

export type WorkflowWithRelations = Awaited<
  ReturnType<typeof getWorkflowByIdWithRelations>
>;

export const getWorkflowByIdWithRelations = protectedProcedure(
  async (_, workflowId: string) => {
    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.isActive, true)),
      with: {
        model: {
          with: {
            provider: true,
          },
        },
        contexts: {
          where: eq(contexts.isActive, true),
          orderBy: (contexts, { desc }) => [desc(contexts.createdAt)],
          with: {
            resources: {
              where: eq(resources.active, true),
              columns: {
                id: true,
                type: true,
                title: true,
                url: true,
              },
              orderBy: (resources, { desc }) => [desc(resources.createdAt)],
            },
          },
        },
        workflowTools: {
          with: {
            tool: true,
          },
        },
        runs: {
          with: {
            model: true,
          },
          limit: 10,
          orderBy: (runs, { desc }) => [desc(runs.createdAt)],
        },
      },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const modelWithCost = {
      ...workflow.model,
      inputPerMillionTokenCost: workflow?.model?.inputPerMillionTokenCost,
      outputPerMillionTokenCost: workflow?.model?.outputPerMillionTokenCost,
    };

    return {
      ...workflow,
      model: modelWithCost,
    };
  }
);

export type LastFiveWorkflows = Awaited<
  ReturnType<typeof getLastFiveWorkflows>
>;

export const getLastFiveWorkflows = protectedProcedure(async ({ user }) => {
  const lastFiveWorkflows = await db.query.workflows.findMany({
    columns: {
      id: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
    where: and(eq(workflows.userId, user.id), eq(workflows.isActive, true)),
    limit: 5,
    orderBy: (workflows, { desc }) => [desc(workflows.updatedAt)],
  });

  return lastFiveWorkflows;
});

export type UserWorkflow = NonNullable<
  Awaited<ReturnType<typeof getUserWorkflows>>["data"]
>[number];

export const getUserWorkflows = protectedProcedure(async ({ user }) => {
  const userWorkflows = await db.query.workflows.findMany({
    where: and(eq(workflows.userId, user.id), eq(workflows.isActive, true)),
    with: {
      model: true,
      runs: {
        limit: 1,
        orderBy: (runs, { desc }) => [desc(runs.createdAt)],
      },
    },
    orderBy: (workflows, { desc }) => [desc(workflows.updatedAt)],
  });

  return {
    data: userWorkflows,
    error: null,
  };
});

export const getWorkflowBySlugAndUserIdWithModelAndModelSettingsAndContexts =
  async (userId: string, slug: string) => {
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.slug, slug),
        eq(workflows.userId, userId),
        eq(workflows.isActive, true)
      ),
      with: {
        model: true,
        modelSettings: true,
        contexts: true,
      },
    });

    if (!workflow) {
      const userWorkflows = await db.query.workflows.findMany({
        where: and(eq(workflows.userId, userId), eq(workflows.isActive, true)),
      });

      return {
        error: "Workflow not found",
        possibleValues: userWorkflows.map((w) => w.slug),
        status: 404,
      };
    }

    return workflow;
  };

export type CreateWorkflowArgs = {
  name: string;
  description?: string;
  slug: string;
  prompt: string;
  modelId: string;
};

export const createWorkflow = protectedProcedure(
  async (
    { user },
    { name, description, slug, prompt, modelId }: CreateWorkflowArgs
  ) => {
    const { plan } = await getCustomerSubscriptionStatus();

    // Hobby: 2 workflows
    // Basic: 10 workflows
    // Pro: Unlimited workflows
    const maxWorkflows = plan === "pro" ? 9999999 : plan === "basic" ? 10 : 2;

    const userWorkflows = await db.query.workflows.findMany({
      where: and(eq(workflows.userId, user.id), eq(workflows.isActive, true)),
    });

    if (userWorkflows.length >= maxWorkflows) {
      throw new Error(
        `You have reached the maximum number of workflows. Upgrade for more.`
      );
    }

    const model = await db.query.models.findFirst({
      where: eq(models.id, modelId),
    });

    if (!model) {
      throw new Error("Model not found");
    }

    const [modelSetting] = await db
      .insert(modelSettings)
      .values([
        {
          id: uuidv7(),
          temperature: model.defaultTemperature,
          temperaturePreset: "BALANCED",
          maxTokens: model.maxTokens,
          maxTokensPreset: "LONG",
        },
      ])
      .returning();

    if (!modelSetting) {
      throw new Error("Failed to create model setting");
    }

    const [knowledgeSaved] = await db
      .insert(knowledge)
      .values({
        id: uuidv7(),
      })
      .returning();

    if (!knowledgeSaved) {
      throw new Error("Failed to create knowledge");
    }

    const [workflow] = await db
      .insert(workflows)
      .values({
        id: uuidv7(),
        name,
        description,
        slug,
        prompt,
        modelId,
        userId: user.id,
        modelSettingsId: modelSetting?.id,
        knowledgeId: knowledgeSaved?.id,
      })
      .returning();

    await sendDiscordNotification({
      content: `🏗️ **NEW WORKFLOW:**\n${user.email} - ${workflow?.name}`,
    });

    return workflow;
  }
);

export const syncPlaygroundChangesToWorkflow = protectedProcedure(
  async ({ user }, workflowId: string, modelId: string, prompt: string) => {
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, workflowId),
        eq(workflows.userId, user.id),
        eq(workflows.isActive, true)
      ),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    await db
      .update(workflows)
      .set({
        modelId,
        prompt,
      })
      .where(eq(workflows.id, workflow.id));

    return workflow;
  }
);

export const updateWorkflowPrompt = protectedProcedure(
  async (_, workflowId: string, prompt: string) => {
    await db
      .update(workflows)
      .set({ prompt })
      .where(eq(workflows.id, workflowId));

    // Revalidate the workflow page to refresh the data
    revalidatePath(`/dashboard/workflows/${workflowId}`);
  }
);

export const checkSlugAvailability = protectedProcedure(
  async ({ user }, slug: string) => {
    const existingWorkflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.slug, slug),
        eq(workflows.userId, user.id),
        eq(workflows.isActive, true)
      ),
    });
    return !existingWorkflow;
  }
);

export const deleteWorkflow = protectedProcedure(
  async ({ user }, workflowId: string) => {
    await db
      .update(workflows)
      .set({ isActive: false })
      .where(and(eq(workflows.id, workflowId), eq(workflows.userId, user.id)));

    await sendDiscordNotification({
      content: `🏗️ **DELETED WORKFLOW:**\n${user.email} - ${workflowId}`,
    });

    revalidatePath(`/dashboard/workflows`);
    redirect(`/dashboard/workflows`);
  }
);

export const updateWorkflowTools = protectedProcedure(
  async (_, workflowId: string, enabledToolIds: string[]) => {
    const { disableWorkflowTool, enableWorkflowTool, getWorkflowTools } =
      await import("../tools/actions");

    // Get current workflow tools
    const currentTools = await getWorkflowTools(workflowId);
    if ("error" in currentTools) {
      return currentTools;
    }

    const currentToolIds = currentTools.map((wt: any) => wt.tool.id);

    // Disable tools that are no longer enabled
    const toolsToDisable = currentToolIds.filter(
      (toolId: string) => !enabledToolIds.includes(toolId)
    );

    // Enable new tools
    const toolsToEnable = enabledToolIds.filter(
      (toolId) => !currentToolIds.includes(toolId)
    );

    // Process disables
    for (const toolId of toolsToDisable) {
      const result = await disableWorkflowTool(workflowId, toolId);
      if ("error" in result) {
        return result;
      }
    }

    // Process enables
    for (const toolId of toolsToEnable) {
      const result = await enableWorkflowTool(workflowId, toolId);
      if (result && "error" in result) {
        return result;
      }
    }

    // Revalidate the workflow tools page
    revalidatePath(`/dashboard/workflows/${workflowId}/tools`);

    return { success: true, data: null };
  }
);
