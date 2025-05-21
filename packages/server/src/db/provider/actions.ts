"use server";

import "server-only";
import { db } from "..";
import { providers } from "../schema";

export type Provider = typeof providers.$inferSelect;

export async function getProviders() {
  return await db.query.providers.findMany();
}
