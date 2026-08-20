/**
 * Single source of truth for everything SEO-facing.
 *
 * Metadata, `robots.txt`, the sitemap, the web manifest, the OG images and the
 * JSON-LD structured data all read from here, so the site never contradicts
 * itself across surfaces.
 */

/**
 * Absolute origin the site is served from.
 *
 * Set `NEXT_PUBLIC_SITE_URL` per environment. On Vercel the production domain is
 * used as a fallback so preview deployments still resolve absolute URLs.
 */
function resolveSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

  if (!configured) {
    return "http://localhost:3000";
  }

  const withProtocol = configured.startsWith("http") ? configured : `https://${configured}`;

  return withProtocol.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "AmueAI",
  tagline: "Custom AI Agents Trained on Your Data",
  description:
    "Train an AI agent on your content in minutes to answer questions, capture leads, and support customers 24/7 across your website, WhatsApp and more.",
  url: resolveSiteUrl(),
  /** BCP 47 tag used for `<html lang>` and `inLanguage`. */
  language: "en",
  /** Open Graph locale, which uses underscores instead of hyphens. */
  locale: "en_US",
  publisher: "Hyepr Labs",
  email: "amueai@hyeprlabs.com",
  twitterHandle: "@hyeprlabs",
  keywords: [
    "AI agent",
    "AI chatbot",
    "customer support automation",
    "AI customer service",
    "lead capture",
    "WhatsApp chatbot",
    "no-code AI agent",
    "AI knowledge base",
  ],
  links: {
    x: "https://x.com/hyeprlabs",
    github: "https://github.com/hyeprlabs",
    instagram: "https://instagram.com/hyeprlabs",
  },
  /** Backdrop colours for `theme-color` and the web manifest, per colour scheme. */
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
} as const;

/** Full title used on the home page and as the default across the site. */
export const siteTitle = `${siteConfig.name} — ${siteConfig.tagline}`;
