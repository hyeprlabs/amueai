import { defineConfig } from "@trigger.dev/sdk";

// PLACEHOLDER — no Trigger.dev MCP connector was available when this was
// scaffolded, and this sandbox has no way to run `npx trigger.dev@latest
// init` interactively to get a real project ref. Replace with the actual
// "proj_..." ref from the Trigger.dev dashboard before deploying, and
// re-verify this whole file once the MCP connector (or CLI login) is
// available — see the build summary.
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
