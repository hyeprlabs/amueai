import { apiError, apiJson, enforceRateLimit } from "@/lib/api-response";
import { serializeLegalPage } from "@/lib/api-v1-serializers";
import { getPublishedLegalPages } from "@/lib/legal-pages";

export const revalidate = 300;

/** GET /api/v1/legal-pages — every published legal page (terms, privacy, etc.). */
export async function GET(request: Request): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:legal-pages");
  if (rateLimit.blocked) return rateLimit.blocked;

  try {
    const pages = await getPublishedLegalPages();
    return apiJson({ data: pages.map(serializeLegalPage) }, rateLimit.headers);
  } catch (error) {
    console.error("[api/v1/legal-pages] Failed to load legal pages:", error);
    return apiError("Content is temporarily unavailable.", 503, rateLimit.headers);
  }
}
