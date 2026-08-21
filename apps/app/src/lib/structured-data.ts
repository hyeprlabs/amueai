import { siteConfig, siteTitle } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

/** A single schema.org node, ready to be serialised into a JSON-LD script tag. */
export type StructuredData = Record<string, unknown> & {
  "@context"?: "https://schema.org";
  "@type": string;
};

/** Stable node identifiers so schemas can reference each other instead of repeating. */
const organizationId = absoluteUrl("/#organization");
const websiteId = absoluteUrl("/#website");

export function organizationSchema(): StructuredData {
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon-512.png"),
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: Object.values(siteConfig.links),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.email,
      availableLanguage: ["English"],
    },
  };
}

export function websiteSchema(): StructuredData {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    name: siteConfig.name,
    alternateName: siteTitle,
    url: absoluteUrl("/"),
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: { "@id": organizationId },
  };
}

type WebPageOptions = {
  name: string;
  description: string;
  pathname: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: StructuredData;
};

export function webPageSchema({
  name,
  description,
  pathname,
  datePublished,
  dateModified,
  breadcrumb,
}: WebPageOptions): StructuredData {
  return {
    "@type": "WebPage",
    "@id": `${absoluteUrl(pathname)}#webpage`,
    name,
    description,
    url: absoluteUrl(pathname),
    inLanguage: siteConfig.language,
    isPartOf: { "@id": websiteId },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(breadcrumb && { breadcrumb }),
  };
}

export function breadcrumbSchema(items: { name: string; pathname: string }[]): StructuredData {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.pathname),
    })),
  };
}

type OfferInput = {
  name: string;
  description: string;
  price: number;
  /** Billing period the price applies to, as an ISO 8601 duration. */
  billingDuration: string;
};

export function softwareApplicationSchema(offers: OfferInput[]): StructuredData {
  return {
    "@type": "SoftwareApplication",
    "@id": absoluteUrl("/#software-application"),
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    publisher: { "@id": organizationId },
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: "USD",
      url: absoluteUrl("/pricing"),
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: offer.price,
        priceCurrency: "USD",
        billingDuration: offer.billingDuration,
        unitText: "per month",
      },
    })),
  };
}

type ArticleOptions = {
  title: string;
  description: string;
  pathname: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName: string;
  authorPathname?: string;
};

export function articleSchema({
  title,
  description,
  pathname,
  image,
  datePublished,
  dateModified,
  authorName,
  authorPathname,
}: ArticleOptions): StructuredData {
  return {
    "@type": "BlogPosting",
    "@id": `${absoluteUrl(pathname)}#article`,
    headline: title,
    description,
    url: absoluteUrl(pathname),
    inLanguage: siteConfig.language,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    ...(image && { image: absoluteUrl(image) }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorPathname && { url: absoluteUrl(authorPathname) }),
    },
  };
}

/** A JSON-LD document holding several linked schema.org nodes. */
export type StructuredDataGraph = {
  "@context": "https://schema.org";
  "@graph": StructuredData[];
};

/**
 * Wraps one or more schemas in a single `@graph` document, which is how
 * schema.org expects several nodes on one page to be published.
 */
export function structuredDataGraph(...schemas: StructuredData[]): StructuredDataGraph {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  };
}
