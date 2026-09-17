import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GZIP_BUDGET_BYTES = 5120;

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, "src/widget/widget.js");
const publicDir = join(root, "public");

const source = readFileSync(sourcePath, "utf8");

const gzipSize = gzipSync(source, { level: 9 }).length;
if (gzipSize > GZIP_BUDGET_BYTES) {
  console.error(
    `[build-widget] src/widget/widget.js is ${gzipSize}b gzipped, over the ${GZIP_BUDGET_BYTES}b budget. ` +
      `Trim the loader - it must stay dependency-free and tiny.`,
  );
  process.exit(1);
}

const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
const fileName = `widget.${hash}.js`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, fileName), source);
writeFileSync(join(publicDir, "widget-manifest.json"), JSON.stringify({ file: fileName }));

console.log(`[build-widget] ${fileName} (${gzipSize}b gzipped, budget ${GZIP_BUDGET_BYTES}b)`);
