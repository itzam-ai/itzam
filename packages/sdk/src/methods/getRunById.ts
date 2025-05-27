import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { type InferRequestType } from "..";
import { createItzamError } from "../errors";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function getRunById(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  runId: InferRequestType<
    (typeof tempClient.api.v1.runs)[":id"]["$get"]
  >["param"]["id"]
) {
  try {
    const response = await client.api.v1.runs[":id"].$get(
      {
        param: { id: runId },
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
    throw createItzamError(error);
  }
}

export { getRunById };
