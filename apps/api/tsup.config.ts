import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src", "src/client/index.d.ts"],
  dts: true,
});
