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
    ...(siteConfig.address && { address: siteConfig.address }),
  };
}

/** Maps our `{ name, pathname }` breadcrumb shape to `<BreadcrumbJsonLd>`'s `items`. */
export function breadcrumbItems(items: { name: string; pathname: string }[]) {
  return items.map((item) => ({
    name: item.name,
    item: absoluteUrl(item.pathname),
  }));
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
  "@type": "WebPage" | "CollectionPage";
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
  type = "WebPage",
}: {
  name: string;
  description: string;
  pathname: string;
  datePublished?: string;
  dateModified?: string;
  /** Use `CollectionPage` for an index that lists other pages. */
  type?: WebPageJsonLd["@type"];
}): WebPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url: absoluteUrl(pathname),
    description,
    inLanguage: siteConfig.language,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
  };
}

export type ItemListJsonLd = {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    url: string;
  }[];
};

/** An ordered list of the entries on an index page, so crawlers see the set as a set. */
export function itemListJsonLd(
  name: string,
  items: { name: string; pathname: string }[],
): ItemListJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.pathname),
    })),
  };
}

export type FaqPageJsonLd = {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }[];
};

/**
 * FAQPage structured data — the single highest-leverage schema for AI search
 * citation (Princeton GEO study: up to +40% visibility). Feed it the same
 * `{ question, answer }` pairs rendered by `<MarketingFaq>` so the page and
 * the markup never diverge.
 */
export function faqPageJsonLd(items: { question: string; answer: string }[]): FaqPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export type SoftwareApplicationJsonLd = {
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: "BusinessApplication";
  operatingSystem: "Web";
  url?: string;
  description?: string;
};

/**
 * The two products a comparison page is about.
 *
 * Described as `SoftwareApplication` entities rather than as a review: the
 * pages are our own, and self-issued ratings are exactly what search engines
 * discard. No `aggregateRating`, no `Review`.
 */
export function comparisonJsonLd({
  competitorName,
  competitorUrl,
}: {
  competitorName: string;
  competitorUrl?: string;
}) {
  const products: SoftwareApplicationJsonLd[] = [
    {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: absoluteUrl("/"),
      description: siteConfig.description,
    },
    {
      "@type": "SoftwareApplication",
      name: competitorName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      ...(competitorUrl && { url: competitorUrl }),
    },
  ];

  return { "@context": "https://schema.org", "@graph": products } as const;
}
