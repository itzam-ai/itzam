import type { AppType } from "@itzam/hono/client/index.d";
import { hc } from "hono/client";
import { type InferRequestType, type WithAttachments } from "..";
import { createItzamError } from "../errors";
import { blobToBase64 } from "../utils";

async function generateText(
  client: ReturnType<typeof hc<AppType>>,
  apiKey: string,
  generateTextRequest: WithAttachments<
    InferRequestType<typeof client.api.v1.generate.text.$post>["json"]
  >
) {
  try {
    // Create a copy of the request to avoid mutating the original
    const processedRequest = { ...generateTextRequest };

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
    const res = await client.api.v1.generate.text.$post(
      {
        json: processedRequest,
      },
      {
        headers: {
          "Api-Key": apiKey,
        },
      }
    );

    const data = await res.json();

    if (!res.ok || "error" in data) {
      throw createItzamError(data);
    }

    return data;
  } catch (error) {
    throw createItzamError(error);
  }
}

export { generateText };
