import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { createItzamError } from "../errors";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function getThreadsByWorkflow(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  workflowSlug: string,
  options?: { lookupKeys?: string | string[] }
) {
  try {
    const response = await client.api.v1.threads.workflow[":workflowSlug"].$get(
      {
        param: { workflowSlug },
        query: {
          lookupKeys: options?.lookupKeys
            ? Array.isArray(options.lookupKeys)
              ? options.lookupKeys
              : [options.lookupKeys]
            : undefined,
        },
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

export { getThreadsByWorkflow };
