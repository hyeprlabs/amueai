import type { Metadata } from "next";
import { JsonLdScript, OrganizationJsonLd } from "next-seo";

import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { Channels } from "@/components/channels";
import { FeatureSection1 } from "@/components/feature-section-1";
import { FeatureSection2 } from "@/components/feature-section-2";
import { CallToAction } from "@/components/cta";
import { siteConfig, siteTitle } from "@/config/site";
import { createMetadata } from "@/lib/seo";
import { organizationJsonLdProps, webSiteJsonLd } from "@/lib/next-seo";

export const metadata: Metadata = createMetadata({
  title: { absolute: siteTitle },
  description: siteConfig.description,
  pathname: "/",
});

export default function Page() {
  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />

      <HeroSection />
      <LogosSection />
      <Channels />
      <FeatureSection1 />
      <FeatureSection2 />
      <CallToAction />
    </>
  );
}
