import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src"],
  experimentalDts: true,
  noExternal: [/@itzam\/hono\/.*/, "@itzam/hono/client/schemas"],
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://itz.am",
  },
});
