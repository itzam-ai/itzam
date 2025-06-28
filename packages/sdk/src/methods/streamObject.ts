import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { createItzamError } from "../errors";
import type {
  GenerateObjectRequest,
  StreamMetadata,
  StreamResponse,
} from "../index";
import type {
  InferReturnFromSchema,
  JsonOrZodSchema,
  RecursivePartial,
} from "../types";
import {
  blobToBase64,
  createEventStream,
  getJsonSchema,
  isJsonSchema,
  type EventHandler,
} from "../utils";

async function streamObject<T extends JsonOrZodSchema>(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  input: GenerateObjectRequest<T>
): Promise<StreamResponse<RecursivePartial<T>>> {
  try {
    const schema = getJsonSchema(input.schema);

    // @ts-expect-error - TODO: fix this
    const isArraySchema = isJsonSchema(schema) && schema.type === "array";

    // Create a copy of the request to avoid mutating the original
    const processedRequest = { ...input, schema };

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
    const response = await client.api.v1.stream.object.$post(
      {
        // @ts-expect-error - TODO: fix this
        json: processedRequest,
      },
      {
        headers: {
          "Api-Key": apiKey,
          Accept: "text/event-stream",
        },
      }
    );

    const reader = (
      response.body as unknown as ReadableStream<Uint8Array>
    ).getReader();

    let metadataResolve: (value: StreamMetadata) => void = () => {
      return;
    };
    const metadataPromise = new Promise<StreamMetadata>((resolve) => {
      metadataResolve = resolve;
    });

    const defaultObject = isArraySchema ? ([] as T[]) : ({} as T);
    let currentObject = defaultObject;
    type ObjectEvent = { object: Record<string, unknown> | T[] };
    const eventHandlers: EventHandler<"object">[] = [
      {
        type: "object",
        handler: (data) => {
          if (isArraySchema) {
            return data.object;
          } else {
            currentObject = {
              ...(currentObject as Record<string, unknown>),
              ...(data as ObjectEvent).object,
            } as T;
            return currentObject as T;
          }
        },
      },
    ];

    const streamResponse = {
      stream: createEventStream(reader, eventHandlers, metadataResolve),
      metadata: metadataPromise,
    };

    return streamResponse as StreamResponse<
      RecursivePartial<InferReturnFromSchema<T>>
    >;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { streamObject };
