import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * The stable url every customer's copy-pasted `<script src=".../widget.js">`
 * snippet points at, forever. It is never the actual payload:
 *
 * - In production, `scripts/build-widget.mjs` (runs as part of `pnpm build`)
 *   writes `public/widget.<hash>.js` plus a manifest naming it. This route
 *   redirects to that content-hashed file, which is served with
 *   `Cache-Control: immutable` (see next.config.ts) - so the actual payload
 *   is cached hard at the edge, while this redirect itself is only
 *   short-cached, so existing embeds pick up a new deploy's widget within
 *   minutes without customers ever touching their snippet.
 * - In dev (no build step has run, no manifest on disk), it serves
 *   `src/widget/widget.js` directly so `pnpm dev` works without a build.
 */
export async function GET(request: Request) {
  try {
    const manifestPath = join(process.cwd(), "public", "widget-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { file: string };

    return NextResponse.redirect(new URL(`/${manifest.file}`, request.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    const source = await readFile(join(process.cwd(), "src", "widget", "widget.js"), "utf8");
    return new NextResponse(source, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
