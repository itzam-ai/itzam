import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  pgTableCreator,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

// Retrieving the auth schema (default for supabase auth)
const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  role: varchar("role", { length: 256 }),
  email: varchar("email", { length: 256 }),
});

export const createTable = pgTableCreator((name) => `${name}`);

// Enums
export const runStatusEnum = pgEnum("run_status", [
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);
export const runOriginEnum = pgEnum("run_origin", ["SDK", "WEB"]);
export const contextItemTypeEnum = pgEnum("context_item_type", [
  "TEXT",
  "IMAGE",
  "FILE",
  "URL",
]);
export const userRoleEnum = pgEnum("user_role", ["MEMBER", "ADMIN"]);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "system",
  "data",
]);

// Provider table
export const providers = createTable("provider", {
  id: varchar("id", { length: 256 }).primaryKey().notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

// Model table
export const models = createTable(
  "model",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    tag: varchar("tag", { length: 256 }).notNull().unique(),
    name: varchar("name", { length: 256 }).notNull(),
    deprecated: boolean("deprecated").notNull().default(false),
    hasVision: boolean("has_vision").notNull().default(false),
    hasReasoningCapability: boolean("has_reasoning_capability")
      .notNull()
      .default(false),
    isOpenSource: boolean("is_open_source").notNull().default(false),
    contextWindowSize: integer("context_window_size").notNull().default(0),
    maxTemperature: decimal("max_temperature", {
      precision: 3,
      scale: 2,
    }).notNull(),
    defaultTemperature: decimal("default_temperature", {
      precision: 3,
      scale: 2,
    }).notNull(),
    maxTokens: integer("max_tokens").notNull(),
    inputPerMillionTokenCost: decimal("input_per_million_token_cost", {
      precision: 10,
      scale: 6,
    }),
    outputPerMillionTokenCost: decimal("output_per_million_token_cost", {
      precision: 10,
      scale: 6,
    }),
    providerId: varchar("provider_id", { length: 256 }).references(
      () => providers.id
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    tagIndex: index("tag_idx").on(table.tag),
    providerIdIndex: index("provider_id_idx").on(table.providerId),
  })
);

// Context table
export const contexts = createTable("context", {
  id: varchar("id", { length: 256 }).primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

// ContextItem table
export const contextItems = createTable(
  "context_item",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    content: text("content").notNull(),
    type: contextItemTypeEnum("type").notNull(),
    contextId: varchar("context_id", { length: 256 }).references(
      () => contexts.id
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    contextIdIndex: index("context_id_idx").on(table.contextId),
  })
);

export const temperaturePresetEnum = pgEnum("temperature_preset", [
  "STRICT",
  "BALANCED",
  "CREATIVE",
  "CUSTOM",
]);

export const maxTokensPresetEnum = pgEnum("max_tokens_preset", [
  "SHORT",
  "MEDIUM",
  "LONG",
  "CUSTOM",
]);

// ModelSettings table
export const modelSettings = createTable("model_settings", {
  id: varchar("id", { length: 256 }).primaryKey().notNull(),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).notNull(),
  temperaturePreset: temperaturePresetEnum("temperature_preset").notNull(),
  maxTokens: integer("max_tokens").notNull(),
  maxTokensPreset: maxTokensPresetEnum("max_tokens_preset").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

// Workflow table
export const workflows = createTable(
  "workflow",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 256 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    prompt: text("prompt").notNull(),
    contextId: varchar("context_id", { length: 256 })
      .notNull()
      .references(() => contexts.id),
    modelId: varchar("model_id", { length: 256 })
      .notNull()
      .references(() => models.id),
    modelSettingsId: varchar("model_settings_id", { length: 256 })
      .notNull()
      .references(() => modelSettings.id),
    knowledgeId: varchar("knowledge_id", { length: 256 })
      .notNull()
      .references(() => knowledge.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    contextIdIndex: index("workflow_context_id_idx").on(table.contextId),
    modelIdIndex: index("workflow_model_id_idx").on(table.modelId),
    modelSettingsIdIndex: index("workflow_model_settings_id_idx").on(
      table.modelSettingsId
    ),
    slugIndex: index("workflow_slug_idx").on(table.slug),
    userIdIndex: index("workflow_user_id_idx").on(table.userId),
  })
);

// Run table
export const runs = createTable(
  "run",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    origin: runOriginEnum("origin").notNull(),
    status: runStatusEnum("status").notNull(),
    input: text("input").notNull(),
    output: text("output"),
    error: text("error"),
    prompt: text("prompt").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cost: decimal("cost", { precision: 10, scale: 6 }).notNull(),
    durationInMs: integer("duration_in_ms").notNull(),
    fullResponse: jsonb("full_response"),
    metadata: jsonb("metadata").default({}),
    groupId: varchar("group_id", { length: 256 }),
    threadId: varchar("thread_id", { length: 256 }).references(
      () => threads.id
    ),
    modelId: varchar("model_id", { length: 256 }).references(() => models.id),
    workflowId: varchar("workflow_id", { length: 256 }).references(
      () => workflows.id
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workflowIdIndex: index("run_workflow_id_idx").on(table.workflowId),
    statusIndex: index("run_status_idx").on(table.status),
    createdAtIndex: index("run_created_at_idx").on(table.createdAt),
    threadIdIndex: index("run_thread_id_idx").on(table.threadId),
  })
);

// RunResource table
export const runResources = createTable(
  "run_resource",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    runId: varchar("run_id", { length: 256 })
      .notNull()
      .references(() => runs.id),
    resourceId: varchar("resource_id", { length: 256 })
      .notNull()
      .references(() => resources.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    compositePk: index("run_resource_pk").on(table.runId, table.resourceId),
    runIdIndex: index("run_resource_run_id_idx").on(table.runId),
    resourceIdIndex: index("run_resource_resource_id_idx").on(table.resourceId),
  })
);

export const knowledge = createTable("knowledge", {
  id: varchar("id", { length: 256 }).primaryKey().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const resourceTypeEnum = pgEnum("resource_type", ["FILE", "LINK"]);
export const resourceStatusEnum = pgEnum("resource_status", [
  "PENDING",
  "PROCESSED",
  "FAILED",
]);

export const resources = createTable(
  "resource",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    title: varchar("title", { length: 256 }),
    fileName: varchar("file_name", { length: 256 }),
    fileSize: integer("file_size"),
    active: boolean("active").notNull().default(true),
    status: resourceStatusEnum("status").notNull().default("PENDING"),
    url: varchar("url", { length: 1024 }).notNull(),
    type: resourceTypeEnum("type").notNull(),
    mimeType: varchar("mime_type", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    knowledgeId: varchar("knowledge_id", { length: 256 }).references(
      () => knowledge.id
    ),
  },
  (table) => ({
    knowledgeIdIndex: index("resource_knowledge_id_idx").on(table.knowledgeId),
  })
);

export const chunks = createTable(
  "chunks",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    resourceId: varchar("resource_id", { length: 256 })
      .notNull()
      .references(() => resources.id),
    workflowId: varchar("workflow_id", { length: 256 })
      .notNull()
      .references(() => workflows.id),
  },
  (table) => ({
    resourceIdIndex: index("chunks_resource_id_idx").on(table.resourceId),
    workflowIdIndex: index("chunks_workflow_id_idx").on(table.workflowId),
  })
);

export const providerKeys = createTable(
  "provider_key",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    secretId: varchar("secret_id", { length: 256 }).notNull().unique(),
    secretName: varchar("secret_name", { length: 256 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    providerId: varchar("provider_id", { length: 256 }).references(
      () => providers.id
    ),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    secretIdIndex: index("provider_key_secret_id_idx").on(table.secretId),
    secretNameIndex: index("provider_key_secret_name_idx").on(table.secretName),
  })
);

export const apiKeys = createTable(
  "api_key",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    shortKey: varchar("short_key", { length: 256 }).notNull().unique(),
    hashedKey: varchar("hashed_key", { length: 256 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    hashedKeyIndex: index("api_key_hashed_key_idx").on(table.hashedKey),
    userIdIndex: index("api_key_user_id_idx").on(table.userId),
  })
);

// ----------------- CHAT --------------------------
export const chats = createTable(
  "chat",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    title: varchar("title", { length: 256 }),
    lastModelId: varchar("last_model_id", { length: 256 }).references(
      () => models.id
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    lastModelTag: varchar("last_model_tag", { length: 256 }),
  },
  (table) => ({
    createdAtIndex: index("chat_created_at_idx").on(table.createdAt),
    updatedAtIndex: index("chat_updated_at_idx").on(table.updatedAt),
  })
);

export const chatMessages = createTable(
  "chat_message",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    modelId: varchar("model_id", { length: 256 }).references(() => models.id),
    modelTag: varchar("model_tag", { length: 256 }),
    modelName: varchar("model_name", { length: 256 }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    cost: decimal("cost", { precision: 10, scale: 6 }).notNull().default("0"),
    tokensUsed: integer("tokens_used").notNull().default(0),
    tokensWithContext: integer("tokens_with_context").notNull().default(0),
    reasoning: text("reasoning"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    durationInMs: integer("duration_in_ms"),
    chatId: varchar("chat_id", { length: 256 }).references(() => chats.id),
  },
  (table) => ({
    createdAtIndex: index("chat_message_created_at_idx").on(table.createdAt),
  })
);

export const messageFiles = createTable("message_file", {
  id: varchar("id", { length: 256 }).primaryKey().notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  name: varchar("name", { length: 256 }),
  contentType: varchar("content_type", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
  messageId: varchar("message_id", { length: 256 }).references(
    () => chatMessages.id
  ),
});

// -------- RELATIONS --------

// -------- Workflow --------
export const workflowRelations = relations(workflows, ({ one, many }) => ({
  model: one(models, {
    fields: [workflows.modelId],
    references: [models.id],
  }),
  modelSettings: one(modelSettings, {
    fields: [workflows.modelSettingsId],
    references: [modelSettings.id],
  }),
  context: one(contexts, {
    fields: [workflows.contextId],
    references: [contexts.id],
  }),
  runs: many(runs),
  threads: many(threads),
  knowledge: one(knowledge, {
    fields: [workflows.knowledgeId],
    references: [knowledge.id],
  }),
}));

// -------- Context --------
export const contextRelations = relations(contexts, ({ many }) => ({
  contextItems: many(contextItems),
}));

// -------- ContextItem --------
export const contextItemRelations = relations(contextItems, ({ one }) => ({
  context: one(contexts, {
    fields: [contextItems.contextId],
    references: [contexts.id],
  }),
}));

// -------- Provider --------
export const providerRelations = relations(providers, ({ many }) => ({
  models: many(models),
}));

// -------- Model --------
export const modelRelations = relations(models, ({ one }) => ({
  provider: one(providers, {
    fields: [models.providerId],
    references: [providers.id],
  }),
}));

// -------- User --------
export const userRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  apiKeys: many(apiKeys),
  providerKeys: many(providerKeys),
}));

// -------- Run --------
export const runRelations = relations(runs, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [runs.workflowId],
    references: [workflows.id],
  }),
  model: one(models, {
    fields: [runs.modelId],
    references: [models.id],
  }),
  runResources: many(runResources),
  thread: one(threads, {
    fields: [runs.threadId],
    references: [threads.id],
  }),
}));

// -------- ApiKey --------
export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// -------- Knowledge --------
export const knowledgeRelations = relations(knowledge, ({ many }) => ({
  resources: many(resources),
}));

// -------- Resource --------
export const resourceRelations = relations(resources, ({ one, many }) => ({
  knowledge: one(knowledge, {
    fields: [resources.knowledgeId],
    references: [knowledge.id],
  }),
  runResources: many(runResources),
  chunks: many(chunks),
}));

// -------- Chunk --------
export const chunkRelations = relations(chunks, ({ one }) => ({
  resource: one(resources, {
    fields: [chunks.resourceId],
    references: [resources.id],
  }),
}));

// -------- ProviderKey --------
export const providerKeyRelations = relations(providerKeys, ({ one }) => ({
  user: one(users, {
    fields: [providerKeys.userId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [providerKeys.providerId],
    references: [providers.id],
  }),
}));

// -------- Chat --------
export const chatRelations = relations(chats, ({ many, one }) => ({
  messages: many(chatMessages),
  lastModel: one(models, {
    fields: [chats.lastModelId],
    references: [models.id],
  }),
}));

export const chatMessageRelations = relations(
  chatMessages,
  ({ one, many }) => ({
    chat: one(chats, {
      fields: [chatMessages.chatId],
      references: [chats.id],
    }),
    model: one(models, {
      fields: [chatMessages.modelId],
      references: [models.id],
    }),
    files: many(messageFiles),
  })
);

export const messageFileRelations = relations(messageFiles, ({ one }) => ({
  message: one(chatMessages, {
    fields: [messageFiles.messageId],
    references: [chatMessages.id],
  }),
}));

// -------- RunResource --------
export const runResourceRelations = relations(runResources, ({ one }) => ({
  run: one(runs, {
    fields: [runResources.runId],
    references: [runs.id],
  }),
  resource: one(resources, {
    fields: [runResources.resourceId],
    references: [resources.id],
  }),
}));

// -------- THREADS --------
export const threads = createTable(
  "thread",
  {
    id: varchar("id", { length: 256 }).primaryKey().notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    lookupKey: varchar("lookup_key", { length: 256 }).unique(),
    workflowId: varchar("workflow_id", { length: 256 })
      .notNull()
      .references(() => workflows.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    lookupKeyIndex: index("thread_lookup_key_idx").on(table.lookupKey),
    createdAtIndex: index("thread_created_at_idx").on(table.createdAt),
    workflowIdIndex: index("thread_workflow_id_idx").on(table.workflowId),
  })
);

// -------- Thread --------
export const threadRelations = relations(threads, ({ many, one }) => ({
  runs: many(runs),
  workflow: one(workflows, {
    fields: [threads.workflowId],
    references: [workflows.id],
  }),
}));
