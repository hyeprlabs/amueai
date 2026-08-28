import { describe, expect, it } from "vitest";

import { isMarkdownEligiblePath, prefersMarkdown } from "@/lib/accept-negotiation";

describe("prefersMarkdown", () => {
  it("returns false for no Accept header", () => {
    expect(prefersMarkdown(null)).toBe(false);
  });

  it("returns false for curl's default wildcard Accept header", () => {
    // Regression test: a wildcard-only header must never read as "prefers
    // markdown" — it matched text/markdown and text/html equally under an
    // earlier, buggy implementation.
    expect(prefersMarkdown("*/*")).toBe(false);
  });

  it("returns true for an explicit text/markdown request", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
  });

  it("returns false for a typical browser Accept header", () => {
    expect(prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")).toBe(
      false,
    );
  });

  it("prefers markdown when it has a higher q-value than html", () => {
    expect(prefersMarkdown("text/html;q=0.5, text/markdown;q=0.9")).toBe(true);
  });

  it("prefers html when it has a higher q-value than markdown", () => {
    expect(prefersMarkdown("text/markdown;q=0.3, text/html;q=0.9")).toBe(false);
  });

  it("treats equal explicit q-values as preferring markdown", () => {
    expect(prefersMarkdown("text/markdown;q=0.5, text/html;q=0.5")).toBe(true);
  });
});

describe("isMarkdownEligiblePath", () => {
  it.each([
    "/",
    "/about",
    "/pricing",
    "/contact",
    "/developers",
    "/changelog",
    "/competitors",
    "/features/agent",
    "/features/channels",
    "/blog",
    "/blog/some-post",
    "/vs/some-competitor",
    "/legal",
    "/legal/terms",
  ])("returns true for %s", (pathname) => {
    expect(isMarkdownEligiblePath(pathname)).toBe(true);
  });

  it.each([
    "/pricing/extra",
    "/features",
    "/features/unknown",
    "/blog/slug/extra",
    "/vs",
    "/dashboard",
    "/sign-in",
    "/api/v1/posts",
  ])("returns false for %s", (pathname) => {
    expect(isMarkdownEligiblePath(pathname)).toBe(false);
  });
});
