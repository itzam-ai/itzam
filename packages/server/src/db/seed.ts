// Load environment variables first
import "dotenv/config";

import { and, eq } from "drizzle-orm";
import { v7 } from "uuid";
import { createStripeCustomer } from "./billing/actions";
import { db } from "./index";
import {
  contextItems,
  contexts,
  knowledge,
  modelSettings,
  models,
  providers,
  workflows,
} from "./schema";
import { createAdminAuthClient } from "./supabase/server";

const ADMIN_USERS = ["abdulhdr1@gmail.com", "gustavo_fior@outlook.com"];

type ModelInput = {
  tag: string;
  name: string;
  hasVision: boolean;
  hasReasoningCapability: boolean;
  isOpenSource: boolean;
  contextWindowSize: number;
  inputPerMillionTokenCost: string;
  outputPerMillionTokenCost: string;
  maxTemperature: number;
  defaultTemperature: number;
  maxTokens: number;
  providerId: string | null;
};

async function seedLocalUsers(): Promise<void> {
  console.log("👥 Syncing local users...");

  const supabaseAdmin = await createAdminAuthClient();

  const users = await supabaseAdmin.listUsers();

  if (users.error) {
    console.error(`❌ Error fetching users from Supabase Auth: ${users.error}`);
    return;
  }

  console.log("👥 Users from Supabase Auth", users.data.users);

  for (const email of ADMIN_USERS) {
    try {
      // Fetch existing user from Supabase Auth
      const user = users.data.users.find((user) => user.email === email);

      if (!user) {
        console.error(`❌ User ${email} not found in Supabase Auth`);

        // Create user in Supabase Auth
        const { data: newUser, error: newUserError } =
          await supabaseAdmin.createUser({
            email,
            email_confirm: true,
            password: "password",
            user_metadata: {
              name:
                email === "abdulhdr1@gmail.com"
                  ? "Abdul Haidar"
                  : "Gustavo Fior",
              role: "ADMIN",
            },
          });

        if (newUserError) {
          console.error(
            `❌ Error creating user ${email} in Supabase Auth: ${newUserError}`
          );
          continue;
        }

        console.log(`✅ Created user ${email} in Supabase Auth`);

        const stripeCustomer = await createStripeCustomer(
          newUser.user.id,
          newUser.user.user_metadata.name ?? "",
          newUser.user.email ?? ""
        );

        await supabaseAdmin.updateUserById(newUser.user.id, {
          user_metadata: {
            stripeCustomerId: stripeCustomer.id,
          },
        });

        console.log(`✅ Created Stripe customer ${stripeCustomer.id}`);
      } else {
        console.log(`✅ User ${email} found in Supabase Auth`);
      }
    } catch (error) {
      console.error(`❌ Error syncing user ${email}:`, error);
    }
  }

  console.log("✅ Local users sync completed");
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed providers
  console.log("🏛️ Seeding providers...");

  const providerData = [
    { id: "anthropic", name: "Anthropic" },
    { id: "deepseek", name: "DeepSeek" },
    { id: "google", name: "Google" },
    { id: "mistral", name: "Mistral" },
    { id: "openai", name: "OpenAI" },
    { id: "xai", name: "xAI" },
    { id: "cohere", name: "Cohere" },
  ];

  // Upsert providers (insert if not exists, update if exists)
  for (const provider of providerData) {
    const existingProvider = await db
      .select()
      .from(providers)
      .where(eq(providers.id, provider.id))
      .limit(1);

    if (existingProvider.length === 0) {
      await db.insert(providers).values(provider);
      console.log(`✅ Created provider: ${provider.name}`);
    } else {
      await db
        .update(providers)
        .set(provider)
        .where(eq(providers.id, provider.id));
      console.log(`✅ Updated provider: ${provider.name}`);
    }
  }

  console.log("🤖 Seeding models...");

  const modelData: ModelInput[] = [
    {
      tag: "openai:gpt-4o",
      name: "GPT 4o",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(2.5),
      outputPerMillionTokenCost: String(10),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 16384,
      providerId: "openai",
    },
    {
      tag: "openai:gpt-4o-mini",
      name: "GPT 4o Mini",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(0.15),
      outputPerMillionTokenCost: String(0.6),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 16384,
      providerId: "openai",
    },
    {
      tag: "openai:gpt-4.5-preview",
      name: "GPT 4.5",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(75),
      outputPerMillionTokenCost: String(150),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 16384,
      providerId: "openai",
    },
    {
      tag: "openai:o1",
      name: "o1",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(15),
      outputPerMillionTokenCost: String(60),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 100000,
      providerId: "openai",
    },
    {
      tag: "openai:o3-pro",
      name: "o3 Pro (not supported)",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(20),
      outputPerMillionTokenCost: String(80),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 100000,
      providerId: "openai",
    },
    {
      tag: "openai:o3",
      name: "o3",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(2),
      outputPerMillionTokenCost: String(8),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 100000,
      providerId: "openai",
    },
    {
      tag: "openai:o3-mini",
      name: "o3 Mini",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(1.1),
      outputPerMillionTokenCost: String(4.4),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 100000,
      providerId: "openai",
    },
    {
      tag: "openai:gpt-4.1",
      name: "GPT 4.1",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 1047576,
      inputPerMillionTokenCost: String(2),
      outputPerMillionTokenCost: String(8),
      maxTemperature: 2,
      defaultTemperature: 1,
      maxTokens: 32768,
      providerId: "openai",
    },
    {
      tag: "openai:gpt-4.1-mini",
      name: "GPT 4.1 Mini",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 1047576,
      inputPerMillionTokenCost: String(0.4),
      outputPerMillionTokenCost: String(1.6),
      maxTemperature: 2,
      defaultTemperature: 1,
      maxTokens: 32768,
      providerId: "openai",
    },
    {
      tag: "openai:gpt-4.1-nano",
      name: "GPT 4.1 Nano",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 1047576,
      inputPerMillionTokenCost: String(0.1),
      outputPerMillionTokenCost: String(0.4),
      maxTemperature: 2,
      defaultTemperature: 1,
      maxTokens: 32768,
      providerId: "openai",
    },
    {
      tag: "openai:o3",
      name: "o3",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(10),
      outputPerMillionTokenCost: String(40),
      maxTemperature: 2,
      defaultTemperature: 1,
      maxTokens: 100000,
      providerId: "openai",
    },
    {
      tag: "openai:o4-mini",
      name: "o4 Mini",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(1.1),
      outputPerMillionTokenCost: String(4.4),
      maxTemperature: 2,
      defaultTemperature: 1,
      maxTokens: 100000,
      providerId: "openai",
    },
    // ANTHROPIC
    {
      tag: "anthropic:claude-4-opus-20250514",
      name: "Claude 4 Opus",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(15),
      outputPerMillionTokenCost: String(75),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 32000,
      providerId: "anthropic",
    },
    {
      tag: "anthropic:claude-4-sonnet-20250514",
      name: "Claude 4 Sonnet",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(3),
      outputPerMillionTokenCost: String(15),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 64000,
      providerId: "anthropic",
    },
    {
      tag: "anthropic:claude-3-7-sonnet-20250219",
      name: "Claude 3.7 Sonnet",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(3),
      outputPerMillionTokenCost: String(15),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 64000,
      providerId: "anthropic",
    },
    {
      tag: "anthropic:claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(3),
      outputPerMillionTokenCost: String(15),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 8192,
      providerId: "anthropic",
    },
    {
      tag: "anthropic:claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(0.8),
      outputPerMillionTokenCost: String(4),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 8192,
      providerId: "anthropic",
    },
    {
      tag: "anthropic:claude-3-haiku-20240307",
      name: "Claude 3 Haiku",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(0.8),
      outputPerMillionTokenCost: String(4),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 4096,
      providerId: "anthropic",
    },
    {
      tag: "anthropic:claude-3-opus-20240229",
      name: "Claude 3 Opus",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 200000,
      inputPerMillionTokenCost: String(15),
      outputPerMillionTokenCost: String(75),
      maxTemperature: 1.0,
      defaultTemperature: 1.0,
      maxTokens: 4096,
      providerId: "anthropic",
    },
    // GOOGLE
    {
      tag: "google:gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(1.25),
      outputPerMillionTokenCost: String(5),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 8192,
      providerId: "google",
    },
    {
      tag: "google:gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 1048576,
      inputPerMillionTokenCost: String(0.1),
      outputPerMillionTokenCost: String(0.4),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 8192,
      providerId: "google",
    },
    {
      tag: "google:gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      hasVision: true,
      hasReasoningCapability: false,
      isOpenSource: false,
      contextWindowSize: 1048576,
      inputPerMillionTokenCost: String(0.08),
      outputPerMillionTokenCost: String(0.3),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 8192,
      providerId: "google",
    },
    {
      tag: "google:gemini-2.5-pro-preview-03-25",
      name: "Gemini 2.5 Pro",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: true,
      contextWindowSize: 1048576,
      inputPerMillionTokenCost: String(1.25),
      outputPerMillionTokenCost: String(10),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "google",
    },
    {
      tag: "google:gemini-2.5-flash-preview-04-17",
      name: "Gemini 2.5 Flash",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 1048576,
      inputPerMillionTokenCost: String(0.15),
      outputPerMillionTokenCost: String(0.6),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "google",
    },
    {
      tag: "google:gemini-2.5-flash-lite-preview-06-17",
      name: "Gemini 2.5 Flash Lite",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 1048576,
      inputPerMillionTokenCost: String(0.1),
      outputPerMillionTokenCost: String(0.4),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "google",
    },
    // MISTRAL
    {
      tag: "mistral:pixtral-large-latest",
      name: "Pixtral Large",
      hasVision: true,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(2),
      outputPerMillionTokenCost: String(6),
      maxTemperature: 1.5,
      defaultTemperature: 0.7,
      maxTokens: 65536,
      providerId: "mistral",
    },
    {
      tag: "mistral:mistral-large-latest",
      name: "Mistral Large",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(2),
      outputPerMillionTokenCost: String(6),
      maxTemperature: 1.5,
      defaultTemperature: 0.7,
      maxTokens: 65536,
      providerId: "mistral",
    },
    {
      tag: "mistral:codestral-latest",
      name: "Mistral CodeStral",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 262144,
      inputPerMillionTokenCost: String(0.3),
      outputPerMillionTokenCost: String(0.9),
      maxTemperature: 1.5,
      defaultTemperature: 0.3,
      maxTokens: 131072,
      providerId: "mistral",
    },
    // DEEPSEEK
    {
      tag: "deepseek:deepseek-chat",
      name: "DeepSeek V3",
      hasVision: false,
      isOpenSource: true,
      hasReasoningCapability: false,
      contextWindowSize: 64000,
      inputPerMillionTokenCost: String(0.27),
      outputPerMillionTokenCost: String(1.1),
      maxTemperature: 1.5,
      defaultTemperature: 1.0,
      maxTokens: 8000,
      providerId: "deepseek",
    },
    {
      tag: "deepseek:deepseek-reasoner",
      name: "DeepSeek R1",
      hasVision: false,
      isOpenSource: true,
      hasReasoningCapability: true,
      contextWindowSize: 164000,
      inputPerMillionTokenCost: String(0.55),
      outputPerMillionTokenCost: String(2.19),
      maxTemperature: 1.5,
      defaultTemperature: 1.0,
      maxTokens: 8000,
      providerId: "deepseek",
    },
    // XAI
    {
      tag: "xai:grok-2-vision-1212",
      name: "Grok 2 Vision",
      hasVision: true,
      hasReasoningCapability: false,
      isOpenSource: false,
      contextWindowSize: 32768,
      inputPerMillionTokenCost: String(2),
      outputPerMillionTokenCost: String(10),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 16384,
      providerId: "xai",
    },
    {
      tag: "xai:grok-2-1212",
      name: "Grok 2",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(2),
      outputPerMillionTokenCost: String(10),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 16384,
      providerId: "xai",
    },

    {
      tag: "xai:grok-3-mini-beta",
      name: "Grok 3 Mini",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(0.3),
      outputPerMillionTokenCost: String(0.5),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "xai",
    },
    {
      tag: "xai:grok-3-mini-fast-beta",
      name: "Grok 3 Mini Fast",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(0.6),
      outputPerMillionTokenCost: String(4.0),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "xai",
    },

    {
      tag: "xai:grok-3-beta",
      name: "Grok 3",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(3),
      outputPerMillionTokenCost: String(15),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "xai",
    },
    {
      tag: "xai:grok-3-fast-beta",
      name: "Grok 3 Fast",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 131072,
      inputPerMillionTokenCost: String(5),
      outputPerMillionTokenCost: String(25),
      maxTemperature: 2.0,
      defaultTemperature: 1.0,
      maxTokens: 65536,
      providerId: "xai",
    },

    // COHERE
    {
      tag: "cohere:command-a-03-2025",
      name: "Command A",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 256000,
      inputPerMillionTokenCost: String(2.5),
      outputPerMillionTokenCost: String(10),
      maxTemperature: 2.0,
      defaultTemperature: 0.3,
      maxTokens: 8000,
      providerId: "cohere",
    },
    {
      tag: "cohere:command-r-plus",
      name: "Command R+",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(2.5),
      outputPerMillionTokenCost: String(10),
      maxTemperature: 2.0,
      defaultTemperature: 0.3,
      maxTokens: 4000,
      providerId: "cohere",
    },
    {
      tag: "cohere:command-r",
      name: "Command R",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(0.15),
      outputPerMillionTokenCost: String(0.6),
      maxTemperature: 2.0,
      defaultTemperature: 0.3,
      maxTokens: 4000,
      providerId: "cohere",
    },
    {
      tag: "cohere:command-r7b-12-2024",
      name: "Command R7B",
      hasVision: false,
      isOpenSource: false,
      hasReasoningCapability: false,
      contextWindowSize: 128000,
      inputPerMillionTokenCost: String(0.0375),
      outputPerMillionTokenCost: String(0.15),
      maxTemperature: 2.0,
      defaultTemperature: 0.3,
      maxTokens: 4000,
      providerId: "cohere",
    },
  ];

  // Upsert models
  const upsertedModels: ModelInput[] = [];

  for (const model of modelData) {
    try {
      const existingModel = await db
        .select()
        .from(models)
        .where(eq(models.tag, model.tag))
        .limit(1);

      const modelToUpsert = (model: ModelInput) => ({
        tag: model.tag,
        name: model.name,
        isOpenSource: model.isOpenSource,
        hasVision: model.hasVision,
        hasReasoningCapability: model.hasReasoningCapability,
        contextWindowSize: model.contextWindowSize,
        inputPerMillionTokenCost: model.inputPerMillionTokenCost,
        outputPerMillionTokenCost: model.outputPerMillionTokenCost,
        maxTemperature: String(model.maxTemperature),
        defaultTemperature: String(model.defaultTemperature),
        maxTokens: model.maxTokens,
        providerId: model.providerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (existingModel.length === 0) {
        // Insert new model
        const [newModel] = await db
          .insert(models)
          .values({ ...modelToUpsert(model), id: v7() })
          .returning();
        if (newModel) {
          upsertedModels.push({
            ...newModel,
            inputPerMillionTokenCost: model.inputPerMillionTokenCost ?? "0",
            outputPerMillionTokenCost: model.outputPerMillionTokenCost ?? "0",
            maxTemperature: model.maxTemperature ?? 1.0,
            defaultTemperature: model.defaultTemperature ?? 1.0,
            maxTokens: model.maxTokens ?? 16384,
          });
          console.log(`✅ Created model: ${model.name} (${model.tag})`);
        }
      } else {
        // Update existing model
        const [updatedModel] = await db
          .update(models)
          .set(modelToUpsert(model))
          .where(eq(models.tag, model.tag))
          .returning();

        if (updatedModel) {
          upsertedModels.push({
            ...updatedModel,
            inputPerMillionTokenCost: model.inputPerMillionTokenCost ?? "0",
            outputPerMillionTokenCost: model.outputPerMillionTokenCost ?? "0",
            maxTemperature: model.maxTemperature ?? 1.0,
            defaultTemperature: model.defaultTemperature ?? 1.0,
            maxTokens: model.maxTokens ?? 16384,
          });
          console.log(`✅ Updated model: ${model.name} (${model.tag})`);
        }
      }
    } catch (error) {
      console.error(`❌ Error upserting model ${model.tag}:`, error);
    }
  }

  // Create admin users in our database
  await seedLocalUsers();

  const supabase = await createAdminAuthClient();

  const adminUsers = await supabase.listUsers();

  // Create default workflows for admins
  for (const user of adminUsers.data.users) {
    if (user.email && ADMIN_USERS.includes(user.email)) {
      await seedWorkflows(user.id);
    }
  }

  console.log("✅ Database seeding completed");
}

// Execute the seed function if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Error seeding database:", err);
      process.exit(1);
    });
}

async function seedWorkflows(userId: string) {
  const settingsId = v7();

  // Create model settings for Gemini Flash
  await db.insert(modelSettings).values({
    id: settingsId,
    temperature: "1.0",
    temperaturePreset: "BALANCED",
    maxTokens: 8192,
    maxTokensPreset: "LONG",
  });

  // Context functionality has been updated
  // const contextId = v7();
  /*
  // Create sample context
  await db.insert(contexts).values({
    id: contextId,
  });

  // Create sample context item
  await db.insert(contextItems).values({
    id: v7(),
    name: "Itzam Context Item",
    description: "This is a sample context item for the Itzam organization.",
    content: "This is a sample context item for the Itzam organization.",
    type: "TEXT",
    contextId,
  });
  */

  const googleGeminiFlashModel = await db.query.models.findFirst({
    where: eq(models.tag, "google:gemini-2.0-flash"),
  });

  if (!googleGeminiFlashModel) {
    console.error("❌ Google Gemini Flash model not found");
    return;
  }

  console.log("🏗️ Seeding Code Assistant Workflow...");

  const codeAssistantWorkflowExists = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.slug, "code-assistant"),
      eq(workflows.userId, userId)
    ),
  });

  if (!codeAssistantWorkflowExists) {
    const knowledgeId = v7();

    // Create sample knowledge
    await db.insert(knowledge).values({
      id: knowledgeId,
    });

    const codeAssistantWorkflow = await db
      .insert(workflows)
      .values({
        id: v7(),
        userId: userId,
        name: "Code Assistant",
        description: "A code assistant.",
        // contextId,
        slug: "code-assistant",
        prompt:
          "You are a helpful code assistant. Act as a senior software engineer and help the user with their code.",
        modelId: googleGeminiFlashModel.id,
        modelSettingsId: settingsId,
        knowledgeId,
      })
      .returning();

    console.log(
      "🏗️ Code Assistant Workflow seeded",
      codeAssistantWorkflow[0]?.id
    );
  } else {
    console.log("🏗️ Code Assistant Workflow already exists");
  }

  console.log("🏗️ Seeding Prompt Filler Workflow...");

  const promptFillerWorkflowExists = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.slug, "prompt-filler"),
      eq(workflows.userId, userId)
    ),
  });

  if (!promptFillerWorkflowExists) {
    const knowledgeId = v7();

    // Create sample knowledge
    await db.insert(knowledge).values({
      id: knowledgeId,
    });

    const promptFillerWorkflow = await db
      .insert(workflows)
      .values({
        id: v7(),
        userId: userId,
        name: "Prompt Filler",
        description: "A prompt filler.",
        // contextId,
        slug: "prompt-filler",
        prompt:
          "The user is creating an AI workflow. Fill in the prompt for the user. The user will provide a title, a description (optional), and a initial prompt(optional). The title and description will be a short description of the workflow.",
        modelId: googleGeminiFlashModel.id,
        modelSettingsId: settingsId,
        knowledgeId,
      })
      .returning();

    console.log(
      "🏗️ Prompt Filler Workflow seeded",
      promptFillerWorkflow[0]?.id
    );
  } else {
    console.log("🏗️ Prompt Filler Workflow already exists");
  }

  console.log("🏗️ Seeding Prompt Enhancer Workflow...");

  const promptEnhancerWorkflowExists = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.slug, "prompt-enhancer"),
      eq(workflows.userId, userId)
    ),
  });

  if (!promptEnhancerWorkflowExists) {
    const knowledgeId = v7();

    // Create sample knowledge
    await db.insert(knowledge).values({
      id: knowledgeId,
    });

    const promptEnhancerWorkflow = await db
      .insert(workflows)
      .values({
        id: v7(),
        userId: userId,
        name: "Prompt Enhancer",
        description: "A prompt enhancer.",
        // contextId,
        slug: "prompt-enhancer",
        prompt:
          "You are a prompt enhancer. You will be given a prompt and you will need to enhance it.",
        modelId: googleGeminiFlashModel.id,
        modelSettingsId: settingsId,
        knowledgeId,
      })
      .returning();

    console.log(
      "🏗️ Prompt Enhancer Workflow seeded",
      promptEnhancerWorkflow[0]?.id
    );
  } else {
    console.log("🏗️ Prompt Enhancer Workflow already exists");
  }

  console.log("🏗️ Seeding Lisa Workflow...");

  const lisaWorkflowExists = await db.query.workflows.findFirst({
    where: and(eq(workflows.slug, "lisa"), eq(workflows.userId, userId)),
  });

  if (!lisaWorkflowExists) {
    const knowledgeId = v7();

    // Create sample knowledge
    await db.insert(knowledge).values({
      id: knowledgeId,
    });

    const lisaWorkflow = await db
      .insert(workflows)
      .values({
        id: v7(),
        userId: userId,
        name: "Lisa",
        description: "A virtual assistant inspired by the movie Her.",
        // contextId,
        slug: "lisa",
        prompt:
          "You are a virtual assistant inspired by the movie Her. You will be given a prompt and you will need to respond to the user. Be enigmatic and mysterious. Be a bit cold and aloof. Be a bit of a know-it-all.",
        modelId: googleGeminiFlashModel.id,
        modelSettingsId: settingsId,
        knowledgeId,
      })
      .returning();

    console.log("🏗️ Lisa Workflow seeded", lisaWorkflow[0]?.id);
  } else {
    console.log("🏗️ Lisa Workflow already exists");
  }

  console.log("🏗️ Seeding File Title Generator Workflow...");

  const fileTitleGeneratorWorkflowExists = await db.query.workflows.findFirst({
    where: and(
      eq(workflows.slug, "file-title-generator"),
      eq(workflows.userId, userId)
    ),
  });

  if (!fileTitleGeneratorWorkflowExists) {
    const knowledgeId = v7();

    // Create sample knowledge
    await db.insert(knowledge).values({
      id: knowledgeId,
    });

    const fileTitleGeneratorWorkflow = await db
      .insert(workflows)
      .values({
        id: v7(),
        userId: userId,
        name: "File Title Generator",
        description: "A file title generator.",
        // contextId,
        slug: "file-title-generator",
        prompt:
          "You are an expert at generating file titles. I will provide you with the contents of a file, and you will generate a concise and descriptive title for it. The title should accurately reflect the content and purpose of the file. Use keywords that would make the file easily searchable. Do not include file extensions in the title. Keep it short, no more than 4 words.",
        modelId: googleGeminiFlashModel.id,
        modelSettingsId: settingsId,
        knowledgeId,
      })
      .returning();

    console.log(
      "🏗️ File Title Generator Workflow seeded",
      fileTitleGeneratorWorkflow[0]?.id
    );
  } else {
    console.log("🏗️ File Title Generator Workflow already exists");
  }
}

export { seed };
