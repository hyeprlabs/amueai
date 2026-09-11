import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

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
