import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { paginationMeta, serializeCompetitor } from "@/lib/api-v1-serializers";
import { getCompetitors } from "@/lib/competitors";
import { parsePageParam } from "@/lib/blog";

export const revalidate = 300;

/** GET /api/v1/competitors — published comparison pages, alphabetical by name. Query param: `page`. */
export async function GET(request: Request): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:competitors");
  if (rateLimit.blocked) return rateLimit.blocked;

  const url = new URL(request.url);
  const page = parsePageParam(url.searchParams.get("page") ?? undefined);

  try {
    const result = await getCompetitors({ page });
    return apiJson(
      { data: result.docs.map(serializeCompetitor), meta: paginationMeta(result) },
      rateLimit.headers,
    );
  } catch (error) {
    console.error("[api/v1/competitors] Failed to load competitors:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
