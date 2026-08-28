import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown-render";

describe("renderMarkdown — static pages", () => {
  it("renders the home page with an H1 and the FAQ", async () => {
    const markdown = await renderMarkdown("/");
    expect(markdown).not.toBeNull();
    expect(markdown).toMatch(/^# AmueAI/);
    expect(markdown).toContain("## FAQ");
    expect(markdown).toContain("What is AmueAI?");
  });

  it("renders about, pricing, contact, developers, and the feature pages", async () => {
    const routes = [
      "/about",
      "/pricing",
      "/contact",
      "/developers",
      "/features/agent",
      "/features/channels",
    ];

    for (const route of routes) {
      const markdown = await renderMarkdown(route);
      expect(markdown, `${route} should render`).not.toBeNull();
      expect(markdown, `${route} should have a heading`).toMatch(/^#\s+\S/);
    }
  });

  it("lists every plan on the pricing page", async () => {
    const markdown = await renderMarkdown("/pricing");
    expect(markdown).toContain("### Basic");
    expect(markdown).toContain("### Pro");
    expect(markdown).toContain("### Business");
  });

  it("returns null for a route with no markdown rendition", async () => {
    await expect(renderMarkdown("/sign-in")).resolves.toBeNull();
    await expect(renderMarkdown("/dashboard")).resolves.toBeNull();
  });

  it("returns null for an over-deep path under an eligible prefix", async () => {
    await expect(renderMarkdown("/pricing/extra")).resolves.toBeNull();
    await expect(renderMarkdown("/features/unknown")).resolves.toBeNull();
  });
});
