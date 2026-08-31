import { defineConfig } from "@trigger.dev/sdk";

// PLACEHOLDER — no Trigger.dev MCP connector or interactive CLI login is
// available in this sandbox, so there's no way to run `npx trigger.dev@latest
// init` and get a real project ref. Replace "<your-project-ref>" with the
// actual "proj_..." ref from the Trigger.dev dashboard, then run
// `npx trigger.dev@latest deploy` (or `dev` locally) to link it for real.
export default defineConfig({
  project: "<your-project-ref>",
  dirs: ["./src/trigger"],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 300,
});
