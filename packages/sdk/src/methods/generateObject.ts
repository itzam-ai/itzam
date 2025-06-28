import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import {
  type InferRequestType,
  type StreamMetadata,
  type WithAttachments,
} from "..";
import { createItzamError } from "../errors";
import type { InferReturnFromSchema, JsonOrZodSchema } from "../types";
import { blobToBase64, getJsonSchema } from "../utils";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

type GenerateObjectRequest<T extends JsonOrZodSchema> = WithAttachments<
  Omit<
    InferRequestType<typeof tempClient.api.v1.generate.object.$post>["json"],
    "schema"
  > & {
    schema: T;
  }
>;

async function generateObject<T extends JsonOrZodSchema>(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  request: GenerateObjectRequest<T>
): Promise<{
  metadata: StreamMetadata;
  object: InferReturnFromSchema<T>;
}> {
  try {
    const schema = getJsonSchema(request.schema);

    // Create a copy of the request to avoid mutating the original
    const processedRequest = { ...request, schema };

    // Check if the request has attachments with binary data that need conversion
    if (processedRequest.attachments?.length) {
      const processedAttachments = await Promise.all(
        processedRequest.attachments.map(async (attachment) => {
          const data = attachment.file as any;
          if (data instanceof Blob || data instanceof File) {
            // Convert Blob or File to base64 string
            const base64Data = await blobToBase64(data);
            return {
              ...attachment,
              file: base64Data,
              mimeType: attachment.mimeType || data.type,
            };
          }
          return attachment;
        })
      );
      processedRequest.attachments = processedAttachments;
    }

    // All requests are sent as JSON
    const res = await client.api.v1.generate.object.$post(
      {
        json: processedRequest,
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!res.ok) throw createItzamError(res);

    const data = await res.json();

    if ("error" in data) {
      throw createItzamError(data);
    }

    return {
      metadata: data.metadata,
      object: data.object as InferReturnFromSchema<T>,
    };
  } catch (error) {
    throw createItzamError(error);
  }
}

export { generateObject };
