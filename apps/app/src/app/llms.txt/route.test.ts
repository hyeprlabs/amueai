import { describe, expect, it } from "vitest";

import { GET } from "@/app/llms.txt/route";

describe("GET /llms.txt", () => {
  it("serves plain text with the required llms.txt sections", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toMatch(/^# AmueAI/);
    expect(text).toContain("## When to use AmueAI");
    expect(text).toContain("/sitemap.xml");
  });
});
