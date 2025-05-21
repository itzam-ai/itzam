// app/statsig-backend.ts

import { env } from "@itzam/utils/env";
import { Statsig, StatsigUser } from "@statsig/statsig-node-core";

const specs: string | null = null;
export const statsig = new Statsig(env.STATSIG_SERVER_KEY!, {
  environment: env.NODE_ENV,
});

// Initialize statsig with options
const initialize = statsig.initialize();

export async function generateBootstrapValues({
  userId,
}: {
  userId?: string;
}): Promise<string> {
  const user = new StatsigUser({ userID: userId, customIDs: {} });
  await initialize;
  const values = statsig.getClientInitializeResponse(user, {
    hashAlgorithm: "djb2",
  }) as string;
  return values;
}
