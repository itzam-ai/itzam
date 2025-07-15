import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import {
  type InferRequestType,
  type InferResponseType,
  type StreamMetadata,
  type WithAttachments,
} from "..";
import { createItzamError } from "../errors";
import type { InferReturnFromSchema, JsonOrZodSchema, ToTuple } from "../types";
import { blobToBase64, getJsonSchema } from "../utils";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

type GenerateObjectRequest<T extends JsonOrZodSchema> = WithAttachments<
  Omit<
    ToTuple<
      InferRequestType<typeof tempClient.api.v1.generate.object.$post>["json"]
    >["0"],
    "schema"
  > & {
    schema: T;
  }
>;

type GenerateObjectEventRequest<T extends JsonOrZodSchema> = WithAttachments<
  Omit<
    ToTuple<
      InferRequestType<typeof tempClient.api.v1.generate.object.$post>["json"]
    >["1"],
    "schema"
  > & {
    schema: T;
  }
>;

type GenerateObjectEventResponse = ToTuple<
  Exclude<
    InferResponseType<typeof tempClient.api.v1.generate.object.$post>,
    {
      error: any;
    }
  >
>["0"];

async function generateObject<
  T extends JsonOrZodSchema,
  E extends "event" | undefined = undefined,
>(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  request: E extends "event"
    ? GenerateObjectEventRequest<T>
    : GenerateObjectRequest<T>
): Promise<
  T extends "event"
    ? GenerateObjectEventResponse
    : {
        metadata: StreamMetadata;
        object: InferReturnFromSchema<T>;
      }
> {
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
        // @ts-expect-error TODO: fix typing
        json: processedRequest,
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw createItzamError(data);
    }

    const data = await res.json();

    if ("type" in processedRequest) {
      return data as T extends "event"
        ? GenerateObjectEventResponse
        : {
            metadata: StreamMetadata;
            object: InferReturnFromSchema<T>;
          };
    }

    return {
      // @ts-expect-error TODO: fix typing
      metadata: data.metadata,
      // @ts-expect-error TODO: fix typing
      object: data.object as InferReturnFromSchema<T>,
    } as T extends "event"
      ? GenerateObjectEventResponse
      : {
          metadata: StreamMetadata;
          object: InferReturnFromSchema<T>;
        };
  } catch (error) {
    throw createItzamError(error);
  }
}

export { generateObject };
