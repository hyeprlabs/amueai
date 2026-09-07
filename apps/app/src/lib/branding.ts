import "server-only";

import { getFirecrawlClient } from "@/lib/firecrawl";

export type AgentBrand = {
  name?: string;
  logo?: string;
  colorScheme?: "light" | "dark";
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
  };
  fontFamily?: string;
};

const BRAND_FETCH_TIMEOUT_MS = 30_000;

function safeColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const isSafe =
    /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ||
    /^(?:rgb|hsl)a?\(\s*[\d.,%\s/-]+\)$/i.test(trimmed) ||
    /^[a-z]{3,20}$/i.test(trimmed);
  return isSafe ? trimmed : undefined;
}

function safeFontFamily(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return /^[\w\s"',-]{1,120}$/.test(trimmed) ? trimmed : undefined;
}

function safeLogoUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export async function extractUrlBranding(url: string): Promise<AgentBrand | undefined> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol: ${parsed.protocol}`);
  }

  let branding;
  try {
    const document = await getFirecrawlClient().scrape(url, {
      formats: ["branding"],
      timeout: BRAND_FETCH_TIMEOUT_MS,
    });
    branding = document.branding;
  } catch (err) {
    console.error(`Firecrawl branding scrape failed for ${url}`, err);
    return undefined;
  }

  if (!branding) return undefined;

  const brand: AgentBrand = {
    name: branding.brandName?.trim() || undefined,
    logo: safeLogoUrl(branding.logo),
    colorScheme: branding.colorScheme,
    colors: {
      primary: safeColor(branding.colors?.primary),
      background: safeColor(branding.colors?.background),
      text: safeColor(branding.colors?.textPrimary),
    },
    fontFamily:
      safeFontFamily(branding.typography?.fontFamilies?.primary) ??
      safeFontFamily(branding.fonts?.[0]?.family),
  };

  if (!brand.colors?.primary && !brand.colors?.background && !brand.colors?.text) {
    delete brand.colors;
  }

  const hasAnything =
    brand.name || brand.logo || brand.colors || brand.fontFamily || brand.colorScheme;
  return hasAnything ? brand : undefined;
}
