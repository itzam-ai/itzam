import { db } from "@itzam/server/db/index";
import { resources } from "@itzam/server/db/schema";
import { env } from "@itzam/utils/env";
import { python } from "@trigger.dev/python";
import { logger, task } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import type { Resource } from "./create-resource";
import { generateFileTitleForResource, getTextFromResource } from "./utils";

export const chunkTask = task({
  id: "chunk",
  run: async ({ resource }: { resource: Resource }) => {
    // SEND TO TIKA
    const { text: textFromTika, fileSize } =
      await getTextFromResource(resource);
    const title = await generateFileTitleForResource(textFromTika, resource);

    await db
      .update(resources)
      .set({ fileSize, title })
      .where(eq(resources.id, resource.id));

    const start = Date.now();

    logger.log("Chunking value", { textLength: textFromTika.length });

    let chunks = await python.runScript("./src/python/chunk.py", [
      resource.url,
      resource.mimeType,
      env.TIKA_URL,
    ]);

    const {
      chunks: chunksArray,
      count,
    }: {
      chunks: string[];
      count: number;
    } = JSON.parse(chunks.stdout);

    const end = Date.now();

    logger.log("Chunking completed", {
      chunksCount: chunksArray.length,
      durationMs: end - start,
    });

    return chunksArray;
  },
});
