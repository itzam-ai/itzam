import type { AppType } from "@itzam/hono/client/index.d";
import { hc, type InferRequestType } from "hono/client";
import { createItzamError } from "../errors";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function createThread(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  createThreadRequest: InferRequestType<
    typeof tempClient.api.v1.threads.$post
  >["json"]
) {
  try {
    const response = await client.api.v1.threads.$post(
      {
        json: createThreadRequest,
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || "error" in data) {
      throw createItzamError(data);
    }

    return data;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { createThread };
