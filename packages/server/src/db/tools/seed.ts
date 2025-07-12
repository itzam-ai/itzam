import { v7 as uuidv7 } from "uuid";
import { db } from "../index";
import { tools } from "../schema";

export async function seedTools() {
  console.log("🔧 Seeding tools...");

  const toolsData = [
    {
      id: uuidv7(),
      type: "WEB_SEARCH" as const,
      name: "Web Search",
      description: "Search the web for current information and retrieve relevant results",
      requiresApiKey: false, // Tavily is handled by Composio
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "CODE_INTERPRETER" as const,
      name: "Code Interpreter",
      description: "Execute code in a sandboxed Python environment with data analysis capabilities",
      requiresApiKey: false,
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "FILE_READER" as const,
      name: "File Reader",
      description: "Read and analyze various file formats including PDFs, documents, and spreadsheets",
      requiresApiKey: false,
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "IMAGE_GENERATION" as const,
      name: "Image Generation",
      description: "Generate images from text descriptions using AI models",
      requiresApiKey: false, // Handled by Composio
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "CALCULATOR" as const,
      name: "Calculator",
      description: "Perform complex mathematical calculations and symbolic math operations",
      requiresApiKey: false,
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "API_CALLER" as const,
      name: "API Caller",
      description: "Make HTTP requests to external APIs with customizable headers and payloads",
      requiresApiKey: false,
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "DATABASE_QUERY" as const,
      name: "Database Query",
      description: "Execute SQL queries on connected databases with read-only access",
      requiresApiKey: true,
      apiKeyName: "DATABASE_CONNECTION_STRING",
      isActive: true,
    },
    {
      id: uuidv7(),
      type: "EMAIL_SENDER" as const,
      name: "Email Sender",
      description: "Send emails through Gmail (requires Gmail authentication)",
      requiresApiKey: true,
      apiKeyName: "Gmail OAuth Token",
      isActive: true,
    },
  ];

  try {
    // Check if tools already exist
    const existingTools = await db.select().from(tools);
    
    if (existingTools.length > 0) {
      console.log("✅ Tools already seeded");
      return;
    }

    // Insert tools
    await db.insert(tools).values(toolsData);
    
    console.log(`✅ Seeded ${toolsData.length} tools`);
  } catch (error) {
    console.error("❌ Error seeding tools:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTools()
    .then(() => {
      console.log("✅ Tools seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Tools seeding failed:", error);
      process.exit(1);
    });
}