import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { paginationMeta, serializeChange } from "@/lib/api-v1-serializers";
import { getChanges } from "@/lib/changelog";
import { parsePageParam } from "@/lib/blog";

export const revalidate = 300;

/** GET /api/v1/changelog — published changelog entries, newest first. Query param: `page`. */
export async function GET(request: Request): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:changelog");
  if (rateLimit.blocked) return rateLimit.blocked;

  const url = new URL(request.url);
  const page = parsePageParam(url.searchParams.get("page") ?? undefined);

  try {
    const result = await getChanges({ page });
    return apiJson(
      { data: result.docs.map(serializeChange), meta: paginationMeta(result) },
      rateLimit.headers,
    );
  } catch (error) {
    console.error("[api/v1/changelog] Failed to load changelog:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
