import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/markdown/[[...path]]/route";

describe("GET /api/markdown/*", () => {
  it("renders the home page markdown for an empty path", async () => {
    const response = await GET(new Request("https://example.com/api/markdown"), {
      params: Promise.resolve({ path: [] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(await response.text()).toMatch(/^# AmueAI/);
  });

  it("renders a nested static page from its path segments", async () => {
    const response = await GET(new Request("https://example.com/api/markdown/pricing"), {
      params: Promise.resolve({ path: ["pricing"] }),
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("# AmueAI Pricing");
  });

  it("returns a markdown 404 body for an unknown path", async () => {
    const response = await GET(new Request("https://example.com/api/markdown/does-not-exist"), {
      params: Promise.resolve({ path: ["does-not-exist"] }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(await response.text()).toContain("Not found");
  });
});
