import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@payload-config": path.resolve(import.meta.dirname, "./src/payload.config.ts"),
      // Next.js resolves this to its no-op export when bundling server
      // code; outside that bundler its default export throws
      // unconditionally, so point it at the no-op directly for tests.
      "server-only": path.resolve(import.meta.dirname, "./node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    env: {
      // Only needed so `src/payload.config.ts` doesn't throw on import — no
      // test in this suite makes a real database connection. DB-backed code
      // paths are exercised through mocks (see `posts/route.test.ts`) or
      // avoided entirely (the static-page branches of `markdown-render.ts`).
      PAYLOAD_SECRET: "test-secret-not-used-for-a-real-database-connection",
    },
  },
});
