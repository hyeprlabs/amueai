import "server-only";

import { getFirecrawlClient } from "@/lib/firecrawl";

/**
 * The slice of Firecrawl's BrandingProfile we actually persist and use.
 *
 * Deliberately narrower than what Firecrawl returns: the full profile
 * carries font stacks, per-heading sizes and a dozen semantic colors, none
 * of which the widget themes on today. Storing only what's used keeps the
 * column honest about what the product actually depends on, and anything
 * added later is one field here plus a render site - not a migration.
 */
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

/** Firecrawl returns colors verbatim from the page; only keep ones safe to drop into CSS. */
function safeColor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  // Hex, rgb()/rgba(), hsl()/hsla(), or a bare CSS keyword. Anything else
  // (url(...), var(...), a stray `;` or `}` closing the rule early) is
  // dropped rather than interpolated into a style attribute later.
  const isSafe =
    /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed) ||
    /^(?:rgb|hsl)a?\(\s*[\d.,%\s/-]+\)$/i.test(trimmed) ||
    /^[a-z]{3,20}$/i.test(trimmed);
  return isSafe ? trimmed : undefined;
}

/** A font-family value is only kept if it's a plain family list, no CSS escapes. */
function safeFontFamily(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return /^[\w\s"',-]{1,120}$/.test(trimmed) ? trimmed : undefined;
}

/** Only absolute http(s) logos - a relative or data: URL would break in the widget. */
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

/**
 * Scrapes a site's visual identity (name, logo, palette, type) with
 * Firecrawl's `branding` format, so an agent trained on a website also
 * looks like that website without the user picking colors by hand.
 *
 * Returns undefined rather than throwing when branding can't be read -
 * this runs alongside content ingestion during onboarding, and a site
 * with no detectable brand must never fail agent creation.
 */
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

  // Drop the colors object entirely if nothing survived validation, so a
  // stored brand never reads as "has colors" when every one was rejected.
  if (!brand.colors?.primary && !brand.colors?.background && !brand.colors?.text) {
    delete brand.colors;
  }

  // Nothing usable found - store null rather than an empty husk.
  const hasAnything =
    brand.name || brand.logo || brand.colors || brand.fontFamily || brand.colorScheme;
  return hasAnything ? brand : undefined;
}
