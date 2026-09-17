import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

async function readManifest(): Promise<{ file: string } | null> {
  try {
    const path = join(process.cwd(), "public", "widget-manifest.json");
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const manifest = await readManifest();

  if (manifest) {
    return NextResponse.redirect(new URL(`/${manifest.file}`, request.url), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  const source = await readFile(join(process.cwd(), "src", "widget", "widget.js"), "utf8");
  return new NextResponse(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
