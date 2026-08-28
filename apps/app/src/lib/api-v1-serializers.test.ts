import { describe, expect, it } from "vitest";

import {
  richTextToPlainText,
  serializeCompetitor,
  serializeLegalPage,
} from "@/lib/api-v1-serializers";
import type { Competitor, LegalPage } from "@/payload-types";

function paragraph(text: string) {
  return {
    root: {
      type: "root",
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: "paragraph",
          version: 1,
          children: [{ type: "text", version: 1, text, format: 0 }],
        },
      ],
    },
  };
}

describe("richTextToPlainText", () => {
  it("flattens a simple paragraph to its text", () => {
    expect(richTextToPlainText(paragraph("Hello, agents."))).toBe("Hello, agents.");
  });

  it("returns an empty string for empty content", () => {
    expect(
      richTextToPlainText({
        root: {
          type: "root",
          direction: "ltr" as const,
          format: "" as const,
          indent: 0,
          version: 1,
          children: [],
        },
      }),
    ).toBe("");
  });
});

describe("serializeCompetitor", () => {
  const competitor = {
    id: 1,
    name: "Acme",
    slug: "acme",
    excerpt: "Acme excerpt.",
    verdict: "Acme verdict.",
    bestFor: "Large teams",
    website: "https://acme.example",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
  } as unknown as Competitor;

  it("maps every field onto the public API shape, including derived url", () => {
    const result = serializeCompetitor(competitor);

    expect(result).toMatchObject({
      slug: "acme",
      name: "Acme",
      excerpt: "Acme excerpt.",
      verdict: "Acme verdict.",
      bestFor: "Large teams",
      website: "https://acme.example",
    });
    expect(result.url).toContain("/vs/acme");
  });

  it("nulls out optional fields rather than leaving them undefined", () => {
    const minimal = { ...competitor, bestFor: null, website: null } as unknown as Competitor;
    const result = serializeCompetitor(minimal);

    expect(result.bestFor).toBeNull();
    expect(result.website).toBeNull();
  });
});

describe("serializeLegalPage", () => {
  it("flattens rich text content and derives the url from the slug", () => {
    const page = {
      id: 1,
      title: "Terms",
      slug: "terms",
      content: paragraph("These are the terms."),
      updatedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    } as unknown as LegalPage;

    const result = serializeLegalPage(page);

    expect(result.title).toBe("Terms");
    expect(result.content).toBe("These are the terms.");
    expect(result.url).toContain("/legal/terms");
  });
});
