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

  const handle = await fetch("http://127.0.0.1:8000/api/v1/create-resource", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.session.session?.access_token}`,
    },
    body: JSON.stringify({
      knowledgeId,
      resources: resources.map((resource) => ({
        type: resource.type,
        id: resource.id,
        url: resource.url,
      })),
      userId: user.data.user.id,
      workflowId,
    }),
  });

  return await handle.json();
}
