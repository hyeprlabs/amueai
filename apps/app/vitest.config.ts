import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Next.js resolves this to its no-op export when bundling server
      // code; outside that bundler its default export throws
      // unconditionally, so point it at the no-op directly for tests.
      "server-only": path.resolve(import.meta.dirname, "./node_modules/server-only/empty.js"),
    },
  },
});
