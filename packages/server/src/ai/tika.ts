"use server";

import { z } from "zod";
import { getFileFromString } from "./utils";
import { env } from "@itzam/utils/env";

const TIKA_URL = env.TIKA_URL || "http://localhost:9998/tika";

const TikaAttachmentSchema = z.object({
  file: z.union([z.string().url(), z.string().regex(/^data:.*?;base64,/)]),
  mimeType: z.string().optional(),
});

export type TikaAttachment = z.infer<typeof TikaAttachmentSchema>;

/**
 * Converts files to text using Apache Tika
 * @param attachments Array of files to process, either as URLs or base64 strings
 * @returns Array of extracted text from each file
 */
export async function tika(attachments: TikaAttachment[]): Promise<
  {
    text: string;
    size: number;
  }[]
> {
  const results: { text: string; size: number }[] = [];
  const batchSize = 10;

  // Process files in batches to avoid overwhelming the server
  for (let i = 0; i < attachments.length; i += batchSize) {
    const batch = attachments.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (attachment) => {
        try {
          // Convert string to File object
          const file = await getFileFromString(
            attachment.file,
            "file",
            attachment.mimeType || "application/octet-stream"
          );

          console.log("file", file);

          // Send to Tika
          const res = await fetch(TIKA_URL, {
            method: "PUT",
            headers: {
              Accept: "text/plain",
            },
            body: file,
          });

          if (!res.ok) {
            throw new Error(`Failed to convert file: ${res.statusText}`);
          }

          const text = await res.text();

          return {
            text,
            size: file.size,
          };
        } catch (err) {
          console.error("Error processing file:", err);
          return {
            text: "",
            size: 0,
          };
        }
      })
    );

    results.push(...batchResults);
  }

  return results.filter((result) => result.text.length > 0); // Filter out failed conversions
}

/**
 * Convenience function to convert a single file
 */
export async function convertSingleFile(
  attachment: TikaAttachment
): Promise<{ text: string; size: number }> {
  const results = await tika([attachment]);
  return results[0] || { text: "", size: 0 };
}
