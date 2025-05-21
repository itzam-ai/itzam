"use server";

import { and, eq } from "drizzle-orm";
import { db } from "..";
import { protectedProcedure } from "../../procedures";
import { modelSettings, models, providers, workflows } from "../schema";
import { revalidatePath } from "next/cache";

export type WorkflowWithModelSettingsAndModelAndProvider =
  typeof workflows.$inferSelect & {
    modelSettings: typeof modelSettings.$inferSelect;
    model: typeof models.$inferSelect & {
      provider: typeof providers.$inferSelect;
    };
  };

export const getWorkflowWithModelSettings = protectedProcedure(
  async ({ user }, workflowId: string) => {
    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.userId, user.id)),
      with: {
        modelSettings: true,
        model: {
          with: {
            provider: true,
          },
        },
      },
    });

    return workflow;
  }
);

type UpdatedModelSettings = {
  workflowId: string;
  modelSettingsId: string;
  modelId: string;
  temperature: string;
  temperaturePreset: "CUSTOM" | "STRICT" | "BALANCED" | "CREATIVE";
  maxTokens: number;
  maxTokensPreset: "CUSTOM" | "SHORT" | "MEDIUM" | "LONG";
};

export const saveModelSettings = protectedProcedure(
  async ({}, updatedModelSettings: UpdatedModelSettings) => {
    await db
      .update(modelSettings)
      .set({
        temperature: updatedModelSettings.temperature.toString(),
        temperaturePreset: updatedModelSettings.temperaturePreset,
        maxTokens: updatedModelSettings.maxTokens,
        maxTokensPreset: updatedModelSettings.maxTokensPreset,
      })
      .where(eq(modelSettings.id, updatedModelSettings.modelSettingsId));

    revalidatePath(`/workflows/${updatedModelSettings.workflowId}`);
  }
);
