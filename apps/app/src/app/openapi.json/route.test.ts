import { describe, expect, it } from "vitest";

import { GET } from "@/app/openapi.json/route";

describe("GET /openapi.json", () => {
  it("serves the OpenAPI document as JSON", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();
    expect(body.openapi).toBe("3.1.0");
    expect(body.paths["/api/v1/posts"]).toBeDefined();
  });
});
