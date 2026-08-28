import type { Metadata } from "next";
import { JsonLdScript, OrganizationJsonLd } from "next-seo";

import { HeroSection } from "@/components/marketing/hero";
import { LogosSection } from "@/components/marketing/logos-section";
import { Channels } from "@/components/marketing/channels";
import { FeatureSection1 } from "@/components/marketing/feature-section-1";
import { FeatureSection2 } from "@/components/marketing/feature-section-2";
import { CallToAction } from "@/components/marketing/cta";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { homeFaqItems } from "@/components/marketing/home-faq-items";
import { siteConfig, siteTitle } from "@/config/site";
import { createMetadata } from "@/lib/seo";
import {
  faqPageJsonLd,
  organizationJsonLdProps,
  webSiteJsonLd,
} from "@/lib/next-seo";

export const metadata: Metadata = createMetadata({
  title: { absolute: siteTitle },
  description: siteConfig.description,
  pathname: "/",
});

export default function Page() {
  return (
    <>
      <OrganizationJsonLd
        {...organizationJsonLdProps()}
        scriptKey="organization"
      />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript data={faqPageJsonLd(homeFaqItems)} scriptKey="faq" />

      <HeroSection />
      <LogosSection />
      <Channels />
      <FeatureSection1 />
      <FeatureSection2 />
      <MarketingFaq items={homeFaqItems} />
      <CallToAction />
    </>
  );
}
