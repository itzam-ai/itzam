"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import "server-only";
import { v7 } from "uuid";
import { db } from "..";
import { adminProcedure } from "../../procedures";
import { models, modelSettings, providers, workflows } from "../schema";
import { getUser } from "../auth/actions";
import { getProviderKey, getProviderKeys } from "../provider-keys/actions";

export type Model = typeof models.$inferSelect;

export type ModelWithProvider = typeof models.$inferSelect & {
  provider: typeof providers.$inferSelect | null;
};

export async function getModelById(id: string) {
  return await db.query.models.findFirst({
    where: eq(models.id, id),
    with: {
      provider: true,
    },
  });
}

export type ModelWithCostAndProvider = NonNullable<
  Awaited<ReturnType<typeof getAvailableModelsWithCost>>
>[number];

export async function getAvailableModelsWithCost() {
  return await db.query.models.findMany({
    with: {
      provider: true,
    },
  });
}

export async function getAvailableModelsBasedOnUserKeys() {
  const providerKeys = await getProviderKeys();

  const providerIds = providerKeys.map((key) => key.providerId);

  const availableModels = await db.query.models.findMany({
    where: inArray(
      models.providerId,
      providerIds.filter((id): id is string => id !== null)
    ),
    with: {
      provider: true,
    },
  });

  return availableModels;
}

export async function updateCurrentModel(
  workflowId: string,
  modelId: string,
  providerId: string
) {
  const providerKey = await getProviderKey(providerId);

  if (!providerKey) {
    throw new Error("Provider key not found");
  }

  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
    with: {
      modelSettings: true,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const model = await db.query.models.findFirst({
    where: eq(models.id, modelId),
  });

  if (!model) {
    throw new Error("Model not found");
  }

  // update model in workflow
  await db
    .update(workflows)
    .set({ modelId })
    .where(eq(workflows.id, workflowId));

  // update model settings
  await db
    .update(modelSettings)
    .set({
      maxTokens: model.maxTokens,
      temperature: model.defaultTemperature,
      maxTokensPreset: "LONG",
      temperaturePreset: "BALANCED",
    })
    .where(eq(modelSettings.id, workflow.modelSettings.id));

  revalidatePath(`/dashboard/workflows/${workflowId}/model`);
}

export type ModelDetails = {
  name: string;
  tag: string;
  providerId: string;
  inputPerMillionTokenCost: string;
  outputPerMillionTokenCost: string;
  contextWindowSize: number;
  hasReasoningCapability: boolean;
  hasVision: boolean;
  isOpenSource: boolean;
  deprecated: boolean;
  maxTemperature: string;
  defaultTemperature: string;
  maxTokens: number;
};

export const createModel = adminProcedure(async (_, model: ModelDetails) => {
  await db.insert(models).values({
    ...model,
    id: v7(),
  });

  revalidatePath("/dashboard/admin/models");
});

export const updateModel = adminProcedure(
  async (_, modelId: string, model: ModelDetails) => {
    await db
      .update(models)
      .set({
        name: model.name,
        tag: model.tag,
        providerId: model.providerId,
        inputPerMillionTokenCost: model.inputPerMillionTokenCost,
        outputPerMillionTokenCost: model.outputPerMillionTokenCost,
        contextWindowSize: model.contextWindowSize,
        hasReasoningCapability: model.hasReasoningCapability,
        hasVision: model.hasVision,
        isOpenSource: model.isOpenSource,
        deprecated: model.deprecated,
        maxTemperature: model.maxTemperature,
        defaultTemperature: model.defaultTemperature,
        maxTokens: model.maxTokens,
      })
      .where(eq(models.id, modelId));

    revalidatePath("/dashboard/admin/models");
  }
);

export const deleteModel = adminProcedure(async (_, modelId: string) => {
  await db.delete(models).where(eq(models.id, modelId));

  revalidatePath("/dashboard/admin/models");
});
