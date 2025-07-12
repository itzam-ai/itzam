import { VercelAIToolSet } from "composio-core";
import { tool } from "ai";
import { z } from "zod";
import { db } from "../db/index";
import { eq } from "drizzle-orm";
import { workflowTools, tools, userToolApiKeys } from "../db/schema";

// Map our tool types to Composio app names
// Based on Composio documentation, these are the available toolkits
const TOOL_TYPE_TO_COMPOSIO_APP: Record<string, string | null> = {
  WEB_SEARCH: "tavily", // Tavily for web search (not tavilyqasearch)
  CODE_INTERPRETER: "codeinterpreter", // Composio's code interpreter
  FILE_READER: "filetool", // File operations
  IMAGE_GENERATION: null, // Not available in Composio, implement locally
  CALCULATOR: null, // Not available in Composio, implement locally
  API_CALLER: null, // Not available as generic tool, implement locally
  DATABASE_QUERY: null, // We'll implement this locally
  EMAIL_SENDER: "gmail", // Gmail for email sending
};

// Initialize Composio toolset
async function initializeComposioToolset(apiKey?: string): Promise<VercelAIToolSet> {
  // If no API key provided, try to use the environment variable
  const composioApiKey = apiKey || process.env.COMPOSIO_API_KEY;
  
  if (!composioApiKey) {
    throw new Error("Composio API key is required but not provided");
  }

  console.log(`Initializing Composio with API Key: ${composioApiKey.substring(0, 10)}...`);
  
  return new VercelAIToolSet({
    apiKey: composioApiKey,
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
  let toolset: VercelAIToolSet;
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

  // Get tools from Composio
  const composioTools: any[] = [];
  
  if (composioApps.size > 0) {
    try {
      const tools = await toolset.getTools({
        apps: Array.from(composioApps),
      });
      if (tools && tools.length > 0) {
        // Add tools from Composio to the list
        composioTools.push(...tools);
      }
    } catch (error) {
      console.error("Failed to get tools from Composio:", error);
    }
  }

  // Add custom implementations for tools that don't have Composio mappings
  const customTools: any[] = [];
  
  for (const workflowTool of enabledTools) {
    if (workflowTool.tool.type === "CALCULATOR") {
      customTools.push(tool({
        name: "calculator",
        description: "Perform safe mathematical calculations",
        parameters: z.object({
          expression: z.string().describe("Mathematical expression to evaluate (e.g., '2 + 2', '16 * 3', '100 / 4')"),
        }),
        execute: async ({ expression }) => {
          try {
            // Safe mathematical evaluation using a simple parser
            // Only allows numbers and basic operators: +, -, *, /, (, )
            const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
            if (sanitized !== expression) {
              return { error: "Invalid characters in expression. Only numbers and +, -, *, /, (, ) are allowed." };
            }
            
            // Use Function constructor with additional safety checks
            const result = new Function("'use strict'; return (" + sanitized + ")")();
            
            if (typeof result !== 'number' || !isFinite(result)) {
              return { error: "Invalid result from calculation" };
            }
            
            return { result: String(result) };
          } catch (error) {
            return { error: "Invalid mathematical expression" };
          }
        },
      }));
    } else if (workflowTool.tool.type === "IMAGE_GENERATION") {
      customTools.push(tool({
        name: "image_generator",
        description: "Generate images using AI (placeholder implementation)",
        parameters: z.object({
          prompt: z.string().describe("Description of the image to generate"),
          width: z.number().optional().default(512).describe("Image width in pixels"),
          height: z.number().optional().default(512).describe("Image height in pixels"),
        }),
        execute: async ({ prompt, width, height }) => {
          // TODO: Integrate with an image generation API like DALL-E, Stable Diffusion, etc.
          return { 
            error: "Image generation not yet implemented. Please configure an image generation service.",
            placeholder: {
              prompt,
              dimensions: `${width}x${height}`,
              message: "Image generation requires API integration"
            }
          };
        },
      }));
    } else if (workflowTool.tool.type === "API_CALLER") {
      customTools.push(tool({
        name: "api_caller",
        description: "Make HTTP API calls to external services",
        parameters: z.object({
          url: z.string().url().describe("The API endpoint URL"),
          method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET').describe("HTTP method"),
          headers: z.record(z.string()).optional().describe("Request headers"),
          body: z.any().optional().describe("Request body (for POST, PUT, PATCH)"),
        }),
        execute: async ({ url, method, headers, body }) => {
          try {
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
              body: body ? JSON.stringify(body) : undefined,
            });
            
            const data = await response.json().catch(() => response.text());
            
            return {
              status: response.status,
              statusText: response.statusText,
              data,
            };
          } catch (error) {
            return { 
              error: `Failed to call API: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
          }
        },
      }));
    } else if (workflowTool.tool.type === "DATABASE_QUERY") {
      // This would need proper implementation based on your database requirements
      customTools.push(tool({
        name: "database_query",
        description: "Query a database (implementation required)",
        parameters: z.object({
          query: z.string().describe("Database query to execute"),
          database: z.string().optional().describe("Database identifier"),
        }),
        execute: async ({ query }) => {
          // TODO: Implement secure database querying
          return { 
            error: "Database query tool not yet implemented. Please configure database access." 
          };
        },
      }));
    }
  }

  return [...composioTools, ...customTools];
}