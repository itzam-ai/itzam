import { type Config } from "drizzle-kit";

import { env } from "@itzam/utils";

export default {
  schema: "./src/db/schema.ts",
  schemaFilter: ["public"],
  dialect: "postgresql",
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
  verbose: true,
  strict: false,
} satisfies Config;
