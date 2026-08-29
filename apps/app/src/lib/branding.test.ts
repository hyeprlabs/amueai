import { beforeEach, describe, expect, it, vi } from "vitest";

const scrapeMock = vi.fn();
vi.mock("@/lib/ingestion", () => ({
  getFirecrawlClient: () => ({ scrape: scrapeMock }),
}));

const { extractUrlBranding } = await import("./branding");

beforeEach(() => {
  scrapeMock.mockReset();
});

describe("extractUrlBranding", () => {
  it("rejects non-http(s) URLs before calling Firecrawl", async () => {
    await expect(extractUrlBranding("file:///etc/passwd")).rejects.toThrow(
      "Unsupported URL protocol",
    );
    expect(scrapeMock).not.toHaveBeenCalled();
  });

  it("maps a full branding profile down to the fields we store", async () => {
    scrapeMock.mockResolvedValue({
      branding: {
        brandName: "  Acme  ",
        logo: "https://acme.com/logo.svg",
        colorScheme: "dark",
        colors: { primary: "#ff0055", background: "rgb(10, 10, 10)", textPrimary: "white" },
        typography: { fontFamilies: { primary: "Inter, sans-serif" } },
      },
    });

    const brand = await extractUrlBranding("https://acme.com");

    expect(brand).toEqual({
      name: "Acme",
      logo: "https://acme.com/logo.svg",
      colorScheme: "dark",
      colors: { primary: "#ff0055", background: "rgb(10, 10, 10)", text: "white" },
      fontFamily: "Inter, sans-serif",
    });
  });

  it("drops colors that could break out of a CSS value", async () => {
    scrapeMock.mockResolvedValue({
      branding: {
        brandName: "Acme",
        colors: {
          primary: "red; } body { display: none",
          background: "url(https://evil.example/x)",
          textPrimary: "var(--leak)",
        },
      },
    });

    const brand = await extractUrlBranding("https://acme.com");

    // Every color was unsafe, so the colors object is dropped entirely
    // rather than left as an object of undefineds.
    expect(brand?.colors).toBeUndefined();
    expect(brand?.name).toBe("Acme");
  });

  it("drops a relative or javascript: logo", async () => {
    scrapeMock.mockResolvedValue({
      branding: { brandName: "Acme", logo: "/logo.png" },
    });
    expect((await extractUrlBranding("https://acme.com"))?.logo).toBeUndefined();

    scrapeMock.mockResolvedValue({
      // oxlint-disable-next-line no-script-url
      branding: { brandName: "Acme", logo: "javascript:alert(1)" },
    });
    expect((await extractUrlBranding("https://acme.com"))?.logo).toBeUndefined();
  });

  it("returns undefined when Firecrawl throws, so onboarding still succeeds", async () => {
    scrapeMock.mockRejectedValue(new Error("firecrawl down"));

    await expect(extractUrlBranding("https://acme.com")).resolves.toBeUndefined();
  });

  it("returns undefined when nothing usable was detected", async () => {
    scrapeMock.mockResolvedValue({ branding: { colors: { primary: "not a color!!" } } });

    await expect(extractUrlBranding("https://acme.com")).resolves.toBeUndefined();
  });
});
