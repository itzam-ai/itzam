"use server";

import { getUser } from "@itzam/server/db/auth/actions";
import {
  createResourceTask as createResourceTaskTrigger,
  tasks,
} from "@itzam/tasks";

type ResourceInput = Parameters<
  typeof tasks.trigger<typeof createResourceTaskTrigger>
>[1]["resources"];
export async function createResourceTask({
  knowledgeId,
  workflowId,
  resources,
}: {
  knowledgeId: string;
  workflowId: string;
  resources: ResourceInput;
}) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  const handle = await tasks.trigger<typeof createResourceTaskTrigger>(
    "create-resource",
    {
      knowledgeId,
      resources,
      userId: user.data.user.id,
      workflowId,
    }
  );

  return handle;
}
