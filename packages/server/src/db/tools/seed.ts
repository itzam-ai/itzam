import { v7 as uuidv7 } from "uuid";
import { db } from "../index";
import { tools } from "../schema";

export async function seedTools() {
  console.log("🔧 Seeding tools...");

  const toolsData: (typeof tools.$inferInsert)[] = [
    {
      id: uuidv7(),
      tag: "COMPOSIO_SEARCH",
      name: "Web Search",
      description:
        "Search the web for current information and retrieve relevant results",
      requiresApiKey: false,
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "CODEINTERPRETER",
      name: "Code Interpreter",
      description:
        "Execute code in a sandboxed Python environment with data analysis capabilities",
      requiresApiKey: false,
      apiKeyName: null,
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "TWITTER",
      name: "Database Query",
      description:
        "Execute SQL queries on connected databases with read-only access",
      requiresApiKey: true,
      apiKeyName: "DATABASE_CONNECTION_STRING",
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "GMAIL",
      name: "Gmail",
      description: "Send emails through Gmail (requires Gmail authentication)",
      requiresApiKey: true,
      apiKeyName: "Gmail OAuth Token",
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "GITHUB",
      name: "Github",
      description: "Interact with Github repositories",
      requiresApiKey: true,
      apiKeyName: "Github Personal Access Token",
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "GOOGLESHEETS",
      name: "Google Sheets",
      description: "Interact with Google Sheets",
      requiresApiKey: true,
      apiKeyName: "Google Sheets API Key",
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "NOTION",
      name: "Notion",
      description: "Interact with Notion databases",
      requiresApiKey: true,
      apiKeyName: "Notion API Key",
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "SHOPIFY",
      name: "Shopify",
      description: "Interact with Shopify stores",
      requiresApiKey: true,
      apiKeyName: "Shopify API Key",
      isActive: true,
    },
    {
      id: uuidv7(),
      tag: "STRIPE",
      name: "Stripe",
      description: "Interact with Stripe",
      requiresApiKey: true,
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
