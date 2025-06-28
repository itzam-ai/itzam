import type { StreamEvent } from "@itzam/hono/client/index.d";
import zodToJsonSchema from "zod-to-json-schema";
import * as z4 from "zod/v4/core";
import type {
  JsonOrZodSchema,
  JsonSchema,
  ZodSchema,
  ZodV4Schema,
} from "./types";

type StreamMetadata = {
  runId: string;
  model: {
    name: string;
    tag: string;
  };
  inputTokens: number;
  outputTokens: number;
  durationInMs: number;
  cost: string;
};

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = function () {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.substring(dataUrl.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = function (error) {
      reject(error);
    };
  });
}

export type EventHandler<T extends StreamEvent["type"]> = {
  type: T;
  handler: (data: Extract<StreamEvent, { type: T }>) => unknown;
};

export async function* createEventStream<T extends StreamEvent["type"]>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  eventHandlers: EventHandler<T>[],
  onMetadata?: (metadata: StreamMetadata) => void
): AsyncGenerator<T, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();

      if (!line) {
        continue;
      }

      if (line.startsWith("event: ")) {
        const eventType = line.slice(7);
        const data = lines[++i]?.slice(6);
        if (!data) {
          continue;
        }

        const parsedData = JSON.parse(data);

        if (eventType === "error") {
          throw new Error(parsedData);
        }

        if (eventType === "finish" && onMetadata) {
          onMetadata(parsedData.metadata);
          continue;
        }

        const handler = eventHandlers.find((h) => h.type === eventType);
        if (handler) {
          const result = await handler.handler(parsedData);
          yield result as T;
        }
      }
    }
  }
}

// https://zod.dev/library-authors?id=how-to-support-zod-3-and-zod-4-simultaneously
export function isZodV4Schema(schema: ZodSchema): schema is ZodV4Schema {
  if ("_zod" in schema) {
    schema._zod.def;
    return true;
  }

  schema._def;
  return false;
}

export function isJsonSchema(schema: JsonOrZodSchema): schema is JsonSchema {
  if (typeof schema === "object" && schema !== null) {
    return "type" in schema;
  }

  return false;
}

export function getJsonSchema(schema: JsonOrZodSchema): JsonSchema {
  if (isJsonSchema(schema)) {
    return schema;
  }

  if (isZodV4Schema(schema)) {
    return z4.toJSONSchema(schema);
  }

  return zodToJsonSchema(schema) as z4.JSONSchema.JSONSchema;
}
