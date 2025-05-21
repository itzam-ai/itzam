"use server";

import { hash } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import "server-only";
import { v7 as uuidv7 } from "uuid";
import { db } from "..";
import { sendDiscordNotification } from "../../discord/actions";
import { getUser } from "../auth/actions";
import { apiKeys } from "../schema";

export type ApiKey = typeof apiKeys.$inferSelect;

export async function getUserApiKeys() {
  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Unauthorized" };
  }

  return await db.query.apiKeys.findMany({
    where: and(
      eq(apiKeys.userId, user.data.user.id),
      eq(apiKeys.isActive, true)
    ),
    orderBy: [sql`${apiKeys.lastUsedAt} DESC NULLS LAST`],
  });
}

export async function validateApiKey(key: string) {
  const hashedKey = hash("sha256", key);

  const apiKey = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.hashedKey, hashedKey), eq(apiKeys.isActive, true)),
  });

  if (!apiKey) {
    throw new Error("Invalid API key");
  }

  return apiKey;
}

export async function updateApiKeyLastUsed(id: string) {
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, id));
}

export async function createApiKey(name: string) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Unauthorized" };
  }

  const userId = user.data.user.id;

  const initialKeyPart =
    "itzam_" + userId + "_" + Math.random().toString(36).substring(2, 15);

  const key =
    initialKeyPart +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const hashedKey = hash("sha256", key);

  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      id: uuidv7(),
      name,
      shortKey: initialKeyPart,
      hashedKey,
      userId,
    })
    .returning();

  await sendDiscordNotification({
    content: `🔑 - Created new API key: ${hashedKey} for user ${user.data.user.email}`,
  });

  return {
    apiKey,
    plainKey: key,
  };
}

export async function deleteApiKey(id: string) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Unauthorized" };
  }

  const userId = user.data.user.id;

  await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));

  await sendDiscordNotification({
    content: `🔑 - Deleted API key: ${id} for user ${user.data.user.email}`,
  });
}
