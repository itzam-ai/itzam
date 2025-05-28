import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { createItzamError } from "../errors";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function getThreadsByWorkflow(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  workflowSlug: string,
  options?: { lookupKey?: string }
) {
  try {
    // For now, we'll use a direct fetch approach since the Hono client doesn't support query params easily
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL;
    const url = new URL(`/api/v1/threads/workflow/${workflowSlug}`, baseUrl);

    if (options?.lookupKey) {
      url.searchParams.set("lookupKey", options.lookupKey);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
      },
    });

    if (!response.ok) throw createItzamError(response);

    const data = await response.json();

    return data;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { getThreadsByWorkflow };
