import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
      "@payload-config": path.resolve(dirname, "src/payload.config.ts"),
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
