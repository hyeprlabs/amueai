import { apiJson, enforceRateLimit } from "@/lib/api-response";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/** GET /api/v1 — index of the public content API, so the base URL is self-describing. */
export async function GET(request: Request): Promise<Response> {
  const rateLimit = enforceRateLimit(request, "v1:index", { limit: 120 });
  if (rateLimit.blocked) return rateLimit.blocked;

  return apiJson(
    {
      name: "AmueAI Content API",
      version: "1.0.0",
      openapi: absoluteUrl("/openapi.json"),
      documentation: absoluteUrl("/developers"),
      endpoints: {
        posts: absoluteUrl("/api/v1/posts"),
        changelog: absoluteUrl("/api/v1/changelog"),
        competitors: absoluteUrl("/api/v1/competitors"),
        legalPages: absoluteUrl("/api/v1/legal-pages"),
      },
    },
    rateLimit.headers,
  );
}
