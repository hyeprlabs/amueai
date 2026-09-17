import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const manifestPath = join(process.cwd(), "public", "widget-manifest.json");
const devSourcePath = join(process.cwd(), "src", "widget", "widget.js");

export async function GET(request: Request) {
  // Missing before the first `build-widget` run (e.g. dev) - fall through to raw source.
  const manifest: { file: string } | null = await readFile(manifestPath, "utf8")
    .then(JSON.parse)
    .catch(() => null);

  if (manifest) {
    return NextResponse.redirect(new URL(`/${manifest.file}`, request.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  const source = await readFile(devSourcePath, "utf8");
  return new NextResponse(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
