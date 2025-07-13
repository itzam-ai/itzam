import { Composio, type Tool } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { env } from "@itzam/utils/env";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { tools, userToolApiKeys, workflowTools } from "../db/schema";

export const composio = new Composio({
  apiKey: env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

// Initialize Composio toolset
async function initializeComposioToolset(
  apiKey?: string
): Promise<Composio<VercelProvider>> {
  // If no API key provided, try to use the environment variable
  const composioApiKey = apiKey || process.env.COMPOSIO_API_KEY;

  if (!composioApiKey) {
    throw new Error("Composio API key is required but not provided");
  }

  console.log(
    `Initializing Composio with API Key: ${composioApiKey.substring(0, 10)}...`
  );

  return new Composio({
    apiKey: env.COMPOSIO_API_KEY,
    provider: new VercelProvider(),
  });
}

// Get tools for a specific workflow
export async function getWorkflowComposioTools(
  workflowId: string,
  userId: string
): Promise<{ [key: string]: Tool }> {
  // Get enabled tools for the workflow
  const workflowToolsList = await db
    .select({
      id: workflowTools.id,
      enabled: workflowTools.enabled,
      configuration: workflowTools.configuration,
      tool: tools,
    })
    .from(workflowTools)
    .innerJoin(
      tools,
      and(eq(workflowTools.toolId, tools.id), eq(tools.isActive, true))
    )
    .where(eq(workflowTools.workflowId, workflowId));

  // Initialize Composio toolset
  let toolset: Composio<VercelProvider>;
  try {
    toolset = await initializeComposioToolset();
  } catch (error) {
    console.error("Failed to initialize Composio toolset:", error);
    return [];
  }

  // Get user API keys for tools that require them
  const userApiKeys = new Map<string, string>();
  if (workflowToolsList.length > 0) {
    const apiKeys = await db
      .select()
      .from(userToolApiKeys)
      .where(eq(userToolApiKeys.userId, userId));

    for (const apiKey of apiKeys) {
      // TODO: Decrypt the API key when vault is implemented
      userApiKeys.set(apiKey.toolId, apiKey.encryptedApiKey);
    }
  }

  return await toolset.tools.get(userId, {
    toolkits: workflowToolsList.map((wt) => wt.tool.tag),
  });
}
