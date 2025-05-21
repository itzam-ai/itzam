import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src"],
  experimentalDts: true,
  noExternal: [/@itzam\/hono\/.*/, "@itzam/hono/client/schemas"],
});
