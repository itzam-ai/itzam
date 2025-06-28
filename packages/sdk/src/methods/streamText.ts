import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { type InferRequestType, type WithAttachments } from "..";
import { createItzamError } from "../errors";
import type { StreamMetadata } from "../index";
import { blobToBase64, createEventStream, type EventHandler } from "../utils";

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

async function streamText(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  input: WithAttachments<
    InferRequestType<typeof tempClient.api.v1.stream.text.$post>["json"]
  >
) {
  try {
    // Create a copy of the request to avoid mutating the original
    const processedRequest = { ...input };

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
    const response = await client.api.v1.stream.text.$post(
      {
        json: processedRequest,
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) throw createItzamError(response);

    const reader = (
      response.body as unknown as ReadableStream<Uint8Array>
    ).getReader();

    let metadataResolve: (value: StreamMetadata) => void = () => {
      return;
    };

    const eventHandlers: EventHandler<"text-delta">[] = [
      {
        type: "text-delta",
        handler: (data) => {
          return data.textDelta;
        },
      },
    ];
    const metadataPromise = new Promise<StreamMetadata>((resolve) => {
      metadataResolve = resolve;
    });

    return {
      stream: createEventStream(reader, eventHandlers, metadataResolve),
      metadata: metadataPromise,
    };
  } catch (error) {
    throw createItzamError(error);
  }
}

export { streamText };
