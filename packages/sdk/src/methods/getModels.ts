import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { createItzamError } from "../errors";

async function getModels(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string
) {
  try {
    const res = await client.api.v1.models.$get(undefined, {
      headers: {
        "Api-Key": apiKey,
      },
    });
    if (!res.ok) {
      const data = await res.json();
      throw createItzamError(data);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { getModels };
