import type { OrganizationJsonLdProps } from "next-seo";

import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

/** Shared `<OrganizationJsonLd>` props, reused on every page. */
export function organizationJsonLdProps(): OrganizationJsonLdProps {
  return {
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: { url: absoluteUrl("/icon-512.png"), width: 512, height: 512 },
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: Object.values(siteConfig.links),
    contactPoint: { contactType: "customer support", email: siteConfig.email },
  };
}

/** Maps our `{ name, pathname }` breadcrumb shape to `<BreadcrumbJsonLd>`'s `items`. */
export function breadcrumbItems(items: { name: string; pathname: string }[]) {
  return items.map((item) => ({ name: item.name, item: absoluteUrl(item.pathname) }));
}

/**
 * `next-seo` doesn't ship dedicated WebSite/WebPage components, so these go
 * through its generic `<JsonLdScript>` — still fully package-native, just
 * typed by us instead of the package.
 */
export type WebSiteJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  inLanguage: string;
};

export function webSiteJsonLd(): WebSiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    inLanguage: siteConfig.language,
  };
}

export type WebPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  url: string;
  description: string;
  inLanguage: string;
  datePublished?: string;
  dateModified?: string;
};

export function webPageJsonLd({
  name,
  description,
  pathname,
  datePublished,
  dateModified,
}: {
  name: string;
  description: string;
  pathname: string;
  datePublished?: string;
  dateModified?: string;
}): WebPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url: absoluteUrl(pathname),
    description,
    inLanguage: siteConfig.language,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
  };
}
