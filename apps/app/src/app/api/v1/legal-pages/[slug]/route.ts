import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { serializeLegalPage } from "@/lib/api-v1-serializers";
import { getLegalPage } from "@/lib/legal-pages";

export const revalidate = 300;

/** GET /api/v1/legal-pages/{slug} — a single published legal page. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:legal-pages");
  if (rateLimit.blocked) return rateLimit.blocked;

  const { slug } = await params;

  try {
    const page = await getLegalPage(slug);
    if (!page)
      return apiError(`No published legal page found for slug "${slug}".`, 404, rateLimit.headers);

    return apiJson({ data: serializeLegalPage(page) }, rateLimit.headers);
  } catch (error) {
    console.error("[api/v1/legal-pages/[slug]] Failed to load legal page:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
