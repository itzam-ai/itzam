# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Getting Started

At the beginning of each conversation, run the following command to understand the current project structure:

```bash
bun scripts/print-tree.ts
```

This will provide a formatted, LLM-friendly view of the file tree with:
- File sizes in human-readable format
- Exclusion of common build artifacts and dependencies
- Maximum depth of 5 levels to keep output manageable
- Clear markdown formatting for easy parsing

## Project Overview

Itzam is an open-source AI integration platform that helps developers create AI applications with features like model hot-swapping, prompt management, and knowledge bases.

## Architecture

Monorepo structure with Turborepo and pnpm workspaces:

```
apps/
├── web/        # Main dashboard (Next.js 15.3.1, React 19.1.0)
├── chat/       # Chat interface 
├── docs/       # Documentation site
└── python/     # FastAPI knowledge service

packages/
├── server/     # Database models (Drizzle ORM) & core business logic
├── utils/      # Shared utilities & Discord notifications
├── sdk/        # JavaScript SDK for API integration
├── hono/       # Hono API server
└── enterprise/ # Enterprise features (billing, usage tracking)

supabase/
└── functions/  # Edge functions (Deno)
```

## Development Commands

```bash
# Initial setup
pnpm copy-env         # Copy .env.example files to .env
pnpm install          # Install Node dependencies
pnpm install-python   # Install Python dependencies (uses UV, not pip)

# Development
pnpm dev              # Start all services (Next.js, Hono, Python)
pnpm build            # Build all packages
pnpm lint             # Run ESLint
pnpm check-types      # TypeScript type checking
pnpm format           # Format with Prettier

# Database
pnpm db:push          # Push Drizzle schema to database
pnpm db:seed          # Seed initial data
pnpm db:studio        # Open Drizzle Studio GUI
pnpm db:sample-data   # Load sample data
pnpm db:drop          # Drop all database tables

# Testing - No test framework currently configured
```

## Key Technologies

- **Frontend**: Next.js 15.3.1, React 19.1.0, TypeScript, Tailwind CSS
- **Backend**: Hono (Node.js), FastAPI (Python), Supabase Functions (Deno)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Providers**: OpenAI, Anthropic, Google, Mistral, Cohere, DeepSeek, Grok
- **Authentication**: Supabase Auth
- **Payment**: Stripe integration
- **Package Management**: pnpm 10.11.0 (Node), UV (Python)

## Code Patterns

### API Integration Pattern
```typescript
// Server-side workflow execution
import { generateText } from "@/server/ai/generateText";

const result = await generateText({
  workflowSlug: "support-chat",
  input: "User question",
  userId: "user-id"
});
```

### Database Repository Pattern
```typescript
// packages/server/src/db/*/repository.ts
export const workflowRepository = {
  findBySlug: async (slug: string) => {
    return await db.query.workflows.findFirst({
      where: eq(workflows.slug, slug)
    });
  }
};
```

### Error Handling
```typescript
import { notifyDiscordError } from "@itzam/utils";

try {
  // Operation
} catch (error) {
  await notifyDiscordError(error, { context: "operation-name" });
  throw error;
}
```

## Important Files

- `packages/server/src/db/schema.ts` - Database schema definition
- `packages/server/src/ai/` - AI provider integrations
- `apps/web/src/app/dashboard/` - Main dashboard pages
- `packages/hono/src/routes/` - API endpoints
- `apps/python/src/api/knowledge.py` - Knowledge management service

## Environment Variables

Critical environment variables (see `.env.example` files):
- `POSTGRES_URL` - Database connection
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` - Supabase config
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` - Payment processing
- AI provider keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.
- `PYTHON_KNOWLEDGE_API_URL` - Python service URL

## Development Guidelines

1. **Monorepo Structure**: All shared code goes in `packages/`, apps in `apps/`
2. **Type Safety**: Use TypeScript strict mode, run `pnpm check-types` before committing
3. **Database Changes**: Always use Drizzle migrations, never modify database directly
4. **API Routes**: Follow RESTful conventions in Hono routes
5. **AI Providers**: Add new providers in `packages/server/src/ai/providers/`
6. **Error Tracking**: Use `notifyDiscordError` for production errors
7. **Python Dependencies**: Use `uv` instead of `pip` for Python packages

## Current Development Focus

The team is working on:
- Context feature for segmented knowledge
- SDK/API error handling improvements
- Documentation improvements
- UI/UX enhancements

Note: Project is in development hiatus, aiming for 10 paid users or 1000 sign-ups by end of June.

## State Management

- Use jotai for complex state management needs