"use server";

import { getUser } from "@itzam/server/db/auth/actions";
import { db } from "@itzam/server/db/index";
import type { Knowledge } from "@itzam/server/db/knowledge/actions";
import { checkPlanLimits } from "@itzam/server/db/knowledge/actions";
import { resources as resourcesTable } from "@itzam/server/db/schema";
import { env } from "@itzam/utils/env";

export async function createResourceAndSendoToAPI({
  knowledgeId,
  contextId,
  workflowId,
  resources,
}: {
  knowledgeId?: string;
  contextId?: string;
  workflowId: string;
  resources: Knowledge["resources"];
}) {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("User not found");
  }

  // check plan limits if adding to knowledge
  if (knowledgeId) {
    await checkPlanLimits(knowledgeId);
  }

  // create resources in the database
  const createdResources = await db
    .insert(resourcesTable)
    .values(resources)
    .returning();

  const resourcesToSend = createdResources.map((resource) => ({
    type: resource.type,
    id: resource.id,
    url: resource.url,
  }));

  const bodyData: any = {
    resources: resourcesToSend,
    userId: user.data.user.id,
    workflowId,
  };

  // Add either knowledgeId or contextId array based on what's provided
  if (knowledgeId) {
    bodyData.knowledgeId = knowledgeId;
  } else if (contextId) {
    bodyData.contextId = [contextId];
  }

  const handle = await fetch(
    `${env.PYTHON_KNOWLEDGE_API_URL}/api/v1/create-resource`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.session.session?.access_token}`,
      },
      body: JSON.stringify(bodyData),
    }
  );

  return await handle.json();
}
