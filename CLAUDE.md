## Getting Started

```bash
tsx scripts/print-tree.ts # print project structure
pnpm copy-env         # Copy .env.example files to .env
pnpm install          # Install Node dependencies
pnpm install-python   # Install Python dependencies (uses UV, not pip)

pnpm dev              # Start all services (Next.js, Hono, Python)
pnpm build            # Build all packages
pnpm lint             # Run ESLint
pnpm check-types      # TypeScript type checking
pnpm format           # Format with Prettier
```

## State Management

- Use jotai for complex state management needs

## Preferred Patterns

- Use react server functions for all frontend-backend integrations