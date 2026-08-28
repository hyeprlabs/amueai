import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { paginationMeta, serializePost } from "@/lib/api-v1-serializers";
import { getPosts, parsePageParam } from "@/lib/blog";

export const revalidate = 300;

/**
 * GET /api/v1/posts — published blog posts, newest first.
 *
 * Query params: `page` (default 1), `category` (category slug filter).
 */
export async function GET(request: Request): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:posts");
  if (rateLimit.blocked) return rateLimit.blocked;

  const url = new URL(request.url);
  const page = parsePageParam(url.searchParams.get("page") ?? undefined);
  const category = url.searchParams.get("category") ?? undefined;

  try {
    const result = await getPosts({ page, category });
    return apiJson(
      { data: result.docs.map(serializePost), meta: paginationMeta(result) },
      rateLimit.headers,
    );
  } catch (error) {
    console.error("[api/v1/posts] Failed to load posts:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
