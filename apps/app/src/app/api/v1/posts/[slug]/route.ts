import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { serializePost } from "@/lib/api-v1-serializers";
import { getPostBySlug } from "@/lib/blog";

export const revalidate = 300;

/** GET /api/v1/posts/{slug} — a single published blog post. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:posts");
  if (rateLimit.blocked) return rateLimit.blocked;

  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);
    if (!post)
      return apiError(`No published post found for slug "${slug}".`, 404, rateLimit.headers);

    return apiJson({ data: serializePost(post) }, rateLimit.headers);
  } catch (error) {
    console.error("[api/v1/posts/[slug]] Failed to load post:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
