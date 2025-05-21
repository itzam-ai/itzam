"use server";

import "server-only";
import { getUser } from "../auth/actions";
import { createAdminClient } from "../supabase/server";
import { db } from "..";
import { providerKeys } from "../schema";
import { eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import {
  createSecret,
  deleteSecret,
  getSecret,
  updateSecret,
} from "../supabase/vault";
import { revalidatePath } from "next/cache";

export type ProviderKey = typeof providerKeys.$inferSelect;
export async function getProviderKeys() {
  const { data: user, error: userError } = await getUser();

  if (userError || !user || !user.user) {
    throw new Error("User not found");
  }

  const userProviderKeys = await db
    .select()
    .from(providerKeys)
    .where(eq(providerKeys.userId, user.user.id));

  return userProviderKeys;
}

export async function getProviderKey(providerId: string) {
  const { data: user, error: userError } = await getUser();

  if (userError || !user || !user.user) {
    throw new Error("User not found");
  }

  const name = `${user.user.id}_${providerId}`;

  const secret = await getSecret(name);

  return secret;
}

export async function createProviderKey(
  providerId: string,
  providerKey: string
) {
  const { data: user, error: userError } = await getUser();

  if (userError || !user || !user.user) {
    throw new Error("User not found");
  }

  const name = `${user.user.id}_${providerId}`;

  const secretId = await createSecret(name, providerKey);

  await db.insert(providerKeys).values({
    id: uuidv7(),
    secretId: secretId,
    secretName: name,
    providerId,
    userId: user.user.id,
  });

  revalidatePath("/dashboard/providers");
}

export async function updateProviderKey(
  providerId: string,
  providerKey: string
) {
  const { data: user, error: userError } = await getUser();

  if (userError || !user || !user.user) {
    throw new Error("User not found");
  }

  const name = `${user.user.id}_${providerId}`;

  const currentProviderKey = await db
    .select()
    .from(providerKeys)
    .where(eq(providerKeys.secretName, name));

  if (!currentProviderKey || currentProviderKey.length === 0) {
    throw new Error("Provider key not found");
  }

  await updateSecret(currentProviderKey[0]?.secretId || "", name, providerKey);
}

export async function deleteProviderKey(providerId: string) {
  const { data: user, error: userError } = await getUser();

  if (userError || !user || !user.user) {
    throw new Error("User not found");
  }

  const name = `${user.user.id}_${providerId}`;

  const deletedSecretId = await deleteSecret(name);

  await db
    .delete(providerKeys)
    .where(eq(providerKeys.secretId, deletedSecretId));

  revalidatePath("/dashboard/providers");
}
