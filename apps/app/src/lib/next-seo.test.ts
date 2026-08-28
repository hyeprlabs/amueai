import { afterEach, describe, expect, it, vi } from "vitest";

import { faqPageJsonLd } from "@/lib/next-seo";

describe("faqPageJsonLd", () => {
  it("maps question/answer pairs onto FAQPage mainEntity", () => {
    const result = faqPageJsonLd([
      { question: "What is it?", answer: "It is a thing." },
      { question: "How much?", answer: "$7/mo." },
    ]);

    expect(result["@type"]).toBe("FAQPage");
    expect(result.mainEntity).toHaveLength(2);
    expect(result.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "What is it?",
      acceptedAnswer: { "@type": "Answer", text: "It is a thing." },
    });
  });

  it("returns an empty mainEntity for no items", () => {
    expect(faqPageJsonLd([]).mainEntity).toEqual([]);
  });
});

describe("organizationJsonLdProps — address", () => {
  const ADDRESS_ENV_KEYS = [
    "NEXT_PUBLIC_BUSINESS_ADDRESS_STREET",
    "NEXT_PUBLIC_BUSINESS_ADDRESS_CITY",
    "NEXT_PUBLIC_BUSINESS_ADDRESS_COUNTRY",
    "NEXT_PUBLIC_BUSINESS_ADDRESS_REGION",
    "NEXT_PUBLIC_BUSINESS_ADDRESS_POSTAL_CODE",
  ] as const;

  afterEach(() => {
    for (const key of ADDRESS_ENV_KEYS) delete process.env[key];
    vi.resetModules();
  });

  it("omits address when the business address env vars are unset", async () => {
    vi.resetModules();
    const { organizationJsonLdProps } = await import("@/lib/next-seo");

    expect(organizationJsonLdProps().address).toBeUndefined();
  });

  it("omits address when only some required fields are set", async () => {
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_STREET = "123 Main St";
    // City and country intentionally left unset.
    vi.resetModules();
    const { organizationJsonLdProps } = await import("@/lib/next-seo");

    expect(organizationJsonLdProps().address).toBeUndefined();
  });

  it("includes a full PostalAddress once street, city, and country are all set", async () => {
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_STREET = "123 Main St";
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_CITY = "Springfield";
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_COUNTRY = "US";
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_REGION = "IL";
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_POSTAL_CODE = "62704";
    vi.resetModules();
    const { organizationJsonLdProps } = await import("@/lib/next-seo");

    expect(organizationJsonLdProps().address).toEqual({
      streetAddress: "123 Main St",
      addressLocality: "Springfield",
      addressCountry: "US",
      addressRegion: "IL",
      postalCode: "62704",
    });
  });
});
