import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader — no dotenv dependency needed for a handful of vars.
try {
  const contents = readFileSync(resolve(__dirname, ".env.local"), "utf8");
  for (const line of contents.split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^"(.*)"$/, "$1");
  }
} catch {
  // .env.local not present (e.g. CI) — tests that need it will fail loudly instead.
}
