import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/v1/route";

describe("GET /api/v1", () => {
  it("returns an index of the content API with rate-limit headers", async () => {
    const response = await GET(new Request("https://example.com/api/v1"));
    expect(response.status).toBe(200);
    expect(response.headers.get("RateLimit-Limit")).toBe("120");

    const body = await response.json();
    expect(body.name).toBe("AmueAI Content API");
    expect(body.endpoints.posts).toContain("/api/v1/posts");
    expect(body.openapi).toContain("/openapi.json");
  });
});
