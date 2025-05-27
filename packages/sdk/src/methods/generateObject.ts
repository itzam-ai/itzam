import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import type { ZodType, ZodTypeDef } from "zod";
import zodToJsonSchema, { type JsonSchema7Type } from "zod-to-json-schema";
import {
  type InferRequestType,
  type StreamMetadata,
  type WithAttachments,
} from "..";
import { createItzamError } from "../errors";

// Helper function to convert Blob/File to base64
function blobToBase64(blob: Blob): Promise<string> {
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

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

type GenerateObjectRequest<T> = WithAttachments<
  Omit<
    InferRequestType<typeof tempClient.api.v1.generate.object.$post>["json"],
    "schema"
  > & {
    schema: ZodType<T, ZodTypeDef, unknown> | JsonSchema7Type;
  }
>;

async function generateObject<T>(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  request: GenerateObjectRequest<T>
): Promise<{
  metadata: StreamMetadata;
  object: T;
}> {
  try {
    const schema =
      "parse" in request.schema
        ? zodToJsonSchema(request.schema)
        : request.schema;

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
      object: data.object as T,
    };
  } catch (error) {
    throw createItzamError(error);
  }
}

export { generateObject };
