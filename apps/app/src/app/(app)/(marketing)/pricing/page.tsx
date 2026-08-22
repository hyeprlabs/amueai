import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
} from "next-seo";

import { plans } from "@/components/marketing/pricing/plans";
import { PricingSection } from "@/components/marketing/pricing/pricing-section";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const title = "Pricing";
const description = `Simple, transparent pricing for ${siteConfig.name}. Compare the Basic, Pro and Business plans and pick the one that scales with your team.`;

export const metadata: Metadata = createMetadata({
  title,
  description,
  pathname: "/pricing",
});

export default function Page() {
  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({ name: title, description, pathname: "/pricing" })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname: "/pricing" },
        ])}
        scriptKey="breadcrumb"
      />
      <SoftwareApplicationJsonLd
        applicationCategory="BusinessApplication"
        description={siteConfig.description}
        name={siteConfig.name}
        offers={plans.map((plan) => ({
          price: plan.price.monthly,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: absoluteUrl("/pricing"),
        }))}
        operatingSystem="Web"
        scriptKey="software-application"
        url={absoluteUrl("/pricing")}
      />

      <PricingSection />
    </>
  );
}
