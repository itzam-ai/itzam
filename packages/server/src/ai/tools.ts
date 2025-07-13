import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { env } from "@itzam/utils/env";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { tools, userToolApiKeys, workflowTools } from "../db/schema";

export const composio = new Composio({
  apiKey: env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

const TOOL_TYPE_TO_COMPOSIO_APP: Record<string, string | null> = {
  CODEINTERPRETER: "CODEINTERPRETER",
  TWITTER: "TWITTER",
  GMAIL: "GMAIL",
  GITHUB: "GITHUB",
  GOOGLESHEETS: "GOOGLESHEETS",
  NOTION: "NOTION",
  SHOPIFY: "SHOPIFY",
  STRIPE: "STRIPE",
  COMPOSIO_SEARCH: "COMPOSIO_SEARCH",
};

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
): Promise<any> {
  // Get enabled tools for the workflow
  const workflowToolsList = await db
    .select({
      id: workflowTools.id,
      enabled: workflowTools.enabled,
      configuration: workflowTools.configuration,
      tool: tools,
    })
    .from(workflowTools)
    .innerJoin(tools, eq(workflowTools.toolId, tools.id))
    .where(eq(workflowTools.workflowId, workflowId));

  // Filter only enabled tools
  const enabledTools = workflowToolsList.filter((wt) => wt.enabled);

  if (enabledTools.length === 0) {
    return [];
  }

  // Initialize Composio toolset
  let toolset: Composio<VercelProvider>;
  try {
    toolset = await initializeComposioToolset();
  } catch (error) {
    console.error("Failed to initialize Composio toolset:", error);
    return [];
  }

  // Collect all Composio app names needed
  const composioApps = new Set<string>();
  const toolsRequiringApiKeys = new Map<string, string>();

  for (const workflowTool of enabledTools) {
    const composioApp = TOOL_TYPE_TO_COMPOSIO_APP[workflowTool.tool.type];

    if (composioApp) {
      composioApps.add(composioApp);

      // Check if this tool requires a user API key
      if (workflowTool.tool.requiresApiKey) {
        toolsRequiringApiKeys.set(workflowTool.tool.id, composioApp);
      }
    }
  }

  // Get user API keys for tools that require them
  const userApiKeys = new Map<string, string>();
  if (toolsRequiringApiKeys.size > 0) {
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
    toolkits: Array.from(composioApps),
  });
}
