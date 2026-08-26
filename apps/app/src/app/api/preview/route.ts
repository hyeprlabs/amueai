import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { getPostBySlug } from "@/lib/blog";

/**
 * Entered from the Blog collection's `admin.livePreview`/`admin.preview` link.
 * Enables Draft Mode and redirects to the post so editors see unpublished
 * content without waiting for a deploy.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  if (!process.env.PAYLOAD_PREVIEW_SECRET || secret !== process.env.PAYLOAD_PREVIEW_SECRET) {
    return new Response("Invalid token", { status: 401 });
  }

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const post = await getPostBySlug(slug, true);
  if (!post) {
    return new Response("Invalid slug", { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(`/blog/${post.slug}`);
}
