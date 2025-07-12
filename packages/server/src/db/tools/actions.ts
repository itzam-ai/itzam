"use server";

import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { protectedProcedure } from "../../procedures";
import { db } from "../index";
import {
  tools,
  workflowTools,
  userToolApiKeys,
  type toolTypeEnum,
} from "../schema";

// -------- 🔧 TOOLS --------

export async function getAllTools() {
  try {
    const allTools = await db
      .select()
      .from(tools)
      .where(eq(tools.isActive, true));

    return allTools;
  } catch (error) {
    console.error("Failed to get all tools", error);
    return { error: { error: "Failed to get all tools", type: "API_ERROR" } };
  }
}

export async function getToolById(toolId: string) {
  try {
    const [tool] = await db.select().from(tools).where(eq(tools.id, toolId));

    if (!tool) {
      return { error: { error: "Tool not found", type: "NOT_FOUND" } };
    }

    return tool;
  } catch (error) {
    console.error("Failed to get tool", error);
    return { error: { error: "Failed to get tool", type: "API_ERROR" } };
  }
}

export async function getToolByType(
  type: (typeof toolTypeEnum.enumValues)[number]
) {
  try {
    const [tool] = await db.select().from(tools).where(eq(tools.type, type));

    if (!tool) {
      return { error: { error: "Tool not found", type: "NOT_FOUND" } };
    }

    return tool;
  } catch (error) {
    console.error("Failed to get tool by type", error);
    return { error: { error: "Failed to get tool", type: "API_ERROR" } };
  }
}

// -------- 🔧 WORKFLOW <> TOOLS --------

export async function getWorkflowTools(workflowId: string) {
  try {
    const workflowToolsList = await db
      .select({
        id: workflowTools.id,
        enabled: workflowTools.enabled,
        configuration: workflowTools.configuration,
        tool: tools,
      })
      .from(workflowTools)
      .innerJoin(tools, eq(workflowTools.toolId, tools.id))
      .where(eq(workflowTools.workflowId, workflowId));

    return workflowToolsList;
  } catch (error) {
    console.error("Failed to get workflow tools", error);
    return { error: { error: "Failed to get workflow tools", type: "API_ERROR" } };
  }
}

export async function enableWorkflowTool(
  workflowId: string,
  toolId: string,
  configuration?: Record<string, any>
) {
  try {
    const existingLink = await db
      .select()
      .from(workflowTools)
      .where(
        and(
          eq(workflowTools.workflowId, workflowId),
          eq(workflowTools.toolId, toolId)
        )
      );

    if (existingLink.length > 0 && existingLink[0]) {
      // Update existing link
      const [updated] = await db
        .update(workflowTools)
        .set({
          enabled: true,
          configuration: configuration || {},
          updatedAt: new Date(),
        })
        .where(eq(workflowTools.id, existingLink[0].id))
        .returning();

      return updated;
    }

    // Create new link
    const [created] = await db
      .insert(workflowTools)
      .values({
        id: uuidv7(),
        workflowId,
        toolId,
        enabled: true,
        configuration: configuration || {},
      })
      .returning();

    return created;
  } catch (error) {
    console.error("Failed to enable workflow tool", error);
    return { error: { error: "Failed to enable tool", type: "API_ERROR" } };
  }
}

export async function disableWorkflowTool(workflowId: string, toolId: string) {
  try {
    const [updated] = await db
      .update(workflowTools)
      .set({
        enabled: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workflowTools.workflowId, workflowId),
          eq(workflowTools.toolId, toolId)
        )
      )
      .returning();

    if (!updated) {
      return { error: { error: "Workflow tool link not found", type: "NOT_FOUND" } };
    }

    return updated;
  } catch (error) {
    console.error("Failed to disable workflow tool", error);
    return { error: { error: "Failed to disable tool", type: "API_ERROR" } };
  }
}

export async function updateWorkflowToolConfiguration(
  workflowId: string,
  toolId: string,
  configuration: Record<string, any>
) {
  try {
    const [updated] = await db
      .update(workflowTools)
      .set({
        configuration,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workflowTools.workflowId, workflowId),
          eq(workflowTools.toolId, toolId)
        )
      )
      .returning();

    if (!updated) {
      return { error: { error: "Workflow tool link not found", type: "NOT_FOUND" } };
    }

    return updated;
  } catch (error) {
    console.error("Failed to update tool configuration", error);
    return { error: { error: "Failed to update configuration", type: "API_ERROR" } };
  }
}

// -------- 🔑 USER <> TOOL API KEYS --------

export const getUserToolApiKey = protectedProcedure(
  async ({ user }, toolId: string) => {
    const [apiKey] = await db
      .select()
      .from(userToolApiKeys)
      .where(
        and(
          eq(userToolApiKeys.userId, user.id),
          eq(userToolApiKeys.toolId, toolId)
        )
      );

    if (!apiKey) {
      return { error: { error: "API key not found", type: "NOT_FOUND" } };
    }

    // For now, return the encrypted key as-is
    // TODO: Implement proper decryption when vault is set up
    return {
      ...apiKey,
      apiKey: apiKey.encryptedApiKey,
    };
  }
);

export const saveUserToolApiKey = protectedProcedure(
  async ({ user }, toolId: string, apiKey: string, keyName: string) => {
    // For now, store the API key as-is
    // TODO: Implement proper encryption when vault is set up
    const encryptedKey = apiKey;

    // Check if user already has a key for this tool
    const existing = await db
      .select()
      .from(userToolApiKeys)
      .where(
        and(
          eq(userToolApiKeys.userId, user.id),
          eq(userToolApiKeys.toolId, toolId)
        )
      );

    if (existing.length > 0 && existing[0]) {
      // Update existing key
      const [updated] = await db
        .update(userToolApiKeys)
        .set({
          encryptedApiKey: encryptedKey,
          keyName,
          updatedAt: new Date(),
        })
        .where(eq(userToolApiKeys.id, existing[0].id))
        .returning();

      return updated;
    }

    // Create new key
    const [created] = await db
      .insert(userToolApiKeys)
      .values({
        id: uuidv7(),
        userId: user.id,
        toolId,
        encryptedApiKey: encryptedKey,
        keyName,
      })
      .returning();

    return created;
  }
);

export const deleteUserToolApiKey = protectedProcedure(
  async ({ user }, toolId: string) => {
    const [deleted] = await db
      .delete(userToolApiKeys)
      .where(
        and(
          eq(userToolApiKeys.userId, user.id),
          eq(userToolApiKeys.toolId, toolId)
        )
      )
      .returning();

    if (!deleted) {
      return { error: { error: "API key not found", type: "NOT_FOUND" } };
    }

    return deleted;
  }
);

export const updateToolApiKeyLastUsed = protectedProcedure(
  async ({ user }, toolId: string) => {
    const [updated] = await db
      .update(userToolApiKeys)
      .set({
        lastUsedAt: new Date(),
      })
      .where(
        and(
          eq(userToolApiKeys.userId, user.id),
          eq(userToolApiKeys.toolId, toolId)
        )
      )
      .returning();

    return updated || null;
  }
);