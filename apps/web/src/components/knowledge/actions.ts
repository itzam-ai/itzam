"use server";

import { getUser } from "@itzam/server/db/auth/actions";
import { tasks, type chunkAndEmbedTask } from "@itzam/tasks";

type ResourceInput = {
  fileName: string;
  url: string;
  mimeType: string;
};

export async function chunkAndEmbed({
  knowledgeId,
  workflowId,
  resources,
}: {
  knowledgeId: string;
  workflowId: string;
  resources: ResourceInput[];
}) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const handle = await tasks.trigger<typeof chunkAndEmbedTask>(
    "chunk-and-embed",
    {
      knowledgeId,
      resources,
      userId: user.data.user.id,
      workflowId,
    }
  );

  return handle;
}
