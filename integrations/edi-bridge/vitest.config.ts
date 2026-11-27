import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@contracts": fileURLToPath(new URL("../../contracts", import.meta.url)) },
  },
  test: { include: ["test/**/*.test.ts"] },
});
