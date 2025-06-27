import "dotenv/config";

import { v7 as v4 } from "uuid";
import { db } from "./index";
import type { Run } from "./run/actions";
import {
  contexts,
  knowledge,
  modelSettings,
  models,
  providers,
  runs,
  workflows,
} from "./schema";
import { seed as seedProvidersAndModels } from "./seed";

// 🔴 run this like this: // npm run db:sample-data -- --userId=user_2uApf321lzB2cvVm0SNHBWk

async function promptForUserId(): Promise<string> {
  // In a real implementation, this would prompt the user
  // For this script, we'll need to pass it as an argument

  const args = process.argv.slice(2);
  const userIdArg = args.find((arg) => arg.startsWith("--userId="));

  if (!userIdArg) {
    console.error("Please provide an user ID with --userId=YOUR_USER_ID");
    process.exit(1);
  }

  return userIdArg.split("=")[1] ?? "";
}

async function createSampleData() {
  console.log("🥇 Checking if providers and models exist...");

  const providersResult = await db.select().from(providers);

  if (!providersResult.length) {
    console.error(
      "❌ No providers found in the database. Please run seed.ts first."
    );
    await seedProvidersAndModels();
  } else {
    console.log("✅ Providers and models already exist in the database.");
  }

  console.log("🌱 Creating sample data...");

  // Get the organization ID from the user
  const userId = await promptForUserId();
  console.log(`Using user ID: ${userId}`);

  // Get a model ID to use for the sample data
  const modelResult = await db.select().from(models);

  if (!modelResult.length) {
    console.error("No models found in the database. Please run seed.ts first.");
    process.exit(1);
  }

  const gtp4o = modelResult.filter((model) => model.tag === "openai:gpt-4o")[0];

  const o1Preview = modelResult.filter((model) => model.tag === "openai:o1")[0];

  const o3Mini = modelResult.filter(
    (model) => model.tag === "openai:o3-mini"
  )[0];

  const claude35Haiku = modelResult.filter(
    (model) => model.tag === "anthropic:claude-3-5-haiku-20241022"
  )[0];

  const claude37Sonnet = modelResult.filter(
    (model) => model.tag === "anthropic:claude-3-7-sonnet-20250219"
  )[0];

  const gemini20Flash = modelResult.filter(
    (model) => model.tag === "google:gemini-2.0-flash"
  )[0];

  const pixtral = modelResult.filter(
    (model) => model.tag === "mistral:pixtral-large-latest"
  )[0];

  const xAI = modelResult.filter(
    (model) => model.tag === "xai:grok-2-vision-1212"
  )[0];

  const modelIds = [
    gtp4o?.id ?? "",
    o1Preview?.id ?? "",
    o3Mini?.id ?? "",
    claude35Haiku?.id ?? "",
    claude37Sonnet?.id ?? "",
    gemini20Flash?.id ?? "",
    pixtral?.id ?? "",
    xAI?.id ?? "",
  ];

  // Create model settings
  console.log("⚙️ Creating model settings...");

  const modelSettingsId = v4();
  await db.insert(modelSettings).values({
    id: modelSettingsId,
    maxTokens: 2000,
    temperature: "0.7",
    temperaturePreset: "BALANCED",
    maxTokensPreset: "LONG",
  });

  // Create knowledge
  console.log("📚 Creating knowledge...");

  const knowledgeId = v4();
  await db.insert(knowledge).values({
    id: knowledgeId,
  });

  // Create workflows
  console.log("🎯 Creating sample workflows...");

  const workflowIds: string[] = [];

  // Workflow 1: Customer Support Assistant
  const customerSupportWorkflowId = v4();
  workflowIds.push(customerSupportWorkflowId);

  await db.insert(workflows).values({
    id: customerSupportWorkflowId,
    name: "Customer Support Assistant",
    slug: "customer-support-assistant",
    description: "AI assistant that helps answer customer support questions",
    prompt:
      "You are a helpful customer support assistant. Use the provided context to answer customer questions accurately and professionally. If you don't know the answer, politely say so and offer to connect them with a human agent.",
    modelId: gtp4o?.id ?? "",
    modelSettingsId: modelSettingsId,
    knowledgeId: knowledgeId,
    userId: userId,
  });

  // Workflow 2: Content Creator
  const contentCreatorWorkflowId = v4();
  workflowIds.push(contentCreatorWorkflowId);

  await db.insert(workflows).values({
    id: contentCreatorWorkflowId,
    name: "Content Creator",
    slug: "content-creator",
    description: "AI assistant that helps create marketing content",
    prompt:
      "You are a creative content assistant. Use the provided brand voice guidelines and content calendar to help create engaging marketing content. Focus on being concise, engaging, and aligned with our brand voice.",
    modelId: claude37Sonnet?.id ?? "",
    modelSettingsId: modelSettingsId,
    knowledgeId: knowledgeId,
    userId: userId,
  });

  // Workflow 3: Code Assistant
  const codeAssistantWorkflowId = v4();
  workflowIds.push(codeAssistantWorkflowId);

  await db.insert(workflows).values({
    id: codeAssistantWorkflowId,
    name: "Code Assistant",
    slug: "code-assistant",
    description: "AI assistant that helps with coding tasks",
    prompt:
      "You are a coding assistant. Help developers write, debug, and optimize code according to our coding standards. Provide explanations for your suggestions and follow best practices.",
    modelId: gtp4o?.id ?? "",
    modelSettingsId: modelSettingsId,
    knowledgeId: knowledgeId,
    userId: userId,
  });

  // Create sample runs
  console.log("🏃 Creating sample runs...");

  // Customer Support Runs
  await db
    .insert(runs)
    .values(generateSampleRuns(customerSupportWorkflowId, modelIds, 389));

  // Content Creator Runs
  await db
    .insert(runs)
    .values(generateSampleRuns(contentCreatorWorkflowId, modelIds, 1923));

  // Code Assistant Runs
  await db
    .insert(runs)
    .values(generateSampleRuns(codeAssistantWorkflowId, modelIds, 842));

  console.log("✅ Sample data creation completed");
}

// Execute the createSampleData function if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error creating sample data:", err);
      process.exit(1);
    });
}

export { createSampleData };

type RunOrigin = "WEB" | "SDK";
type RunStatus = "COMPLETED" | "FAILED";

export function generateSampleRuns(
  workflowId: string,
  modelIds: string[],
  count: number
) {
  const runs: Run[] = [];

  for (let i = 0; i < count; i++) {
    const randomDate = new Date(
      Date.now() - 86400000 * Math.floor(Math.random() * 30)
    );

    runs.push({
      id: v4(),
      origin: Math.random() > 0.5 ? "WEB" : ("SDK" as RunOrigin),
      status: Math.random() > 0.2 ? "COMPLETED" : ("FAILED" as RunStatus),
      input: "How do I reset my password?",
      output: "You have to go to the login page and click 'Forgot Password'.",
      prompt: "You are a helpful customer support assistant.",
      inputTokens: Math.floor(Math.random() * 1000),
      outputTokens: Math.floor(Math.random() * 1000),
      cost: String((Math.random() * 10).toFixed(6)),
      threadId: Math.random() > 0.8 ? v4() : null,
      durationInMs: Math.floor(Math.random() * 1000),
      modelId: modelIds[Math.floor(Math.random() * modelIds.length)] as string,
      workflowId: workflowId,
      createdAt: randomDate,
      updatedAt: randomDate,
      fullResponse: null,
      metadata: {},
      error: null,
    });
  }

  return runs;
}
