import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { createItzamError } from "../errors";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function getRunsByThread(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  threadId: string
) {
  try {
    const response = await client.api.v1.threads[":threadId"].runs.$get(
      {
        param: { threadId },
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw createItzamError(data);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { getRunsByThread };
