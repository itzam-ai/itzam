import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    POSTGRES_URL: z.string().url(),
    OPENAI_API_KEY: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_ACCESS_KEY_ID: z.string(),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string(),
    CLOUDFLARE_BUCKET: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Stripe environment variables
    STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_ITZAM_PRO_PRODUCT_ID: z.string().min(1),
    STRIPE_ITZAM_BASIC_PRODUCT_ID: z.string().min(1),
    STATSIG_SERVER_KEY: z.string().min(1),
    STATSIG_CONSOLE_KEY: z.string().min(1),
    ITZAM_API_KEY: z.string().min(1),
    DISCORD_WEBHOOK_URL: z.string().min(1),
    VERCEL_WEBHOOK_SECRET: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    PYTHON_KNOWLEDGE_API_URL: z.string().url(),
    RESCRAPE_CRON_SECRET: z.string().min(1),
    HYPERDX_API_KEY: z.string().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    COMPOSIO_API_KEY: z.string().min(1),
    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string().min(1),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string(),
    NEXT_PUBLIC_STATSIG_CLIENT_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STATSIG_CONSOLE_KEY: process.env.STATSIG_CONSOLE_KEY,
    STATSIG_SERVER_KEY: process.env.STATSIG_SERVER_KEY,
    POSTGRES_URL: process.env.POSTGRES_URL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    CLOUDFLARE_BUCKET: process.env.CLOUDFLARE_BUCKET,
    NODE_ENV: process.env.NODE_ENV,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_ITZAM_PRO_PRODUCT_ID: process.env.STRIPE_ITZAM_PRO_PRODUCT_ID,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STATSIG_CLIENT_KEY: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY,
    ITZAM_API_KEY: process.env.ITZAM_API_KEY,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    VERCEL_WEBHOOK_SECRET: process.env.VERCEL_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    PYTHON_KNOWLEDGE_API_URL: process.env.PYTHON_KNOWLEDGE_API_URL,
    RESCRAPE_CRON_SECRET: process.env.RESCRAPE_CRON_SECRET,
    HYPERDX_API_KEY: process.env.HYPERDX_API_KEY,
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    STRIPE_ITZAM_BASIC_PRODUCT_ID: process.env.STRIPE_ITZAM_BASIC_PRODUCT_ID,
    COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */

  emptyStringAsUndefined: true,
});
