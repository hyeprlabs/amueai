import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { serializeCompetitor } from "@/lib/api-v1-serializers";
import { getCompetitorBySlug } from "@/lib/competitors";

export const revalidate = 300;

/** GET /api/v1/competitors/{slug} — a single published comparison page. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:competitors");
  if (rateLimit.blocked) return rateLimit.blocked;

  const { slug } = await params;

  try {
    const competitor = await getCompetitorBySlug(slug);
    if (!competitor) {
      return apiError(`No published comparison found for slug "${slug}".`, 404, rateLimit.headers);
    }

    return apiJson({ data: serializeCompetitor(competitor) }, rateLimit.headers);
  } catch (error) {
    console.error("[api/v1/competitors/[slug]] Failed to load competitor:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
