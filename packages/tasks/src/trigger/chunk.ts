import { python } from "@trigger.dev/python";
import { task } from "@trigger.dev/sdk/v3";

export const myScript = task({
  id: "chunk",
  run: async ({ text }: { text: string }) => {
    const result = await python.runScript("../python/chunk.py", [text]);
    return result.stdout;
  },
});
