import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { getPostBySlug } from "@/lib/blog";
import { getCompetitorBySlug } from "@/lib/competitors";
import { PREVIEW_ROUTES, type PreviewCollection } from "@/lib/preview";

const loaders: Record<PreviewCollection, (slug: string) => Promise<{ slug: string } | undefined>> =
  {
    blog: (slug) => getPostBySlug(slug, { draft: true }),
    competitors: (slug) => getCompetitorBySlug(slug, { draft: true }),
  };

const isPreviewCollection = (value: string | null): value is PreviewCollection =>
  Boolean(value && value in loaders);

/**
 * Entered from a collection's `admin.livePreview`/`admin.preview` link. Enables
 * Draft Mode and redirects to the document so editors see unpublished content
 * without waiting for a deploy.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");
  // `collection` was added after the Blog shipped; older admin links omit it.
  const collection = searchParams.get("collection") ?? "blog";

  if (!process.env.PAYLOAD_PREVIEW_SECRET || secret !== process.env.PAYLOAD_PREVIEW_SECRET) {
    return new Response("Invalid token", { status: 401 });
  }

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  if (!isPreviewCollection(collection)) {
    return new Response("Unknown collection", { status: 400 });
  }

  const doc = await loaders[collection](slug);
  if (!doc) {
    return new Response("Invalid slug", { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(`${PREVIEW_ROUTES[collection]}/${doc.slug}`);
}
