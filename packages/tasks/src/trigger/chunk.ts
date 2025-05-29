import { python } from "@trigger.dev/python";
import { task } from "@trigger.dev/sdk/v3";

export const chunkTask = task({
  id: "chunk",
  run: async ({ content, mimeType }: { content: string; mimeType: string }) => {
    const result = await python.runScript("../python/chunk.py", [
      content,
      mimeType,
    ]);
    return result.stdout;
  },
});
