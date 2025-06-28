import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { createItzamError } from "../errors";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function getThreadById(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  threadId: string
) {
  try {
    const response = await client.api.v1.threads[":id"].$get(
      {
        param: { id: threadId },
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) throw createItzamError(response);

    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error);

    throw createItzamError(error);
  }
}

export { getThreadById };
