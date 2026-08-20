import type { Metadata } from "next";

import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { Channels } from "@/components/channels";
import { FeatureSection1 } from "@/components/feature-section-1";
import { FeatureSection2 } from "@/components/feature-section-2";
import { CallToAction } from "@/components/cta";
import { JsonLd } from "@/components/json-ld";
import { siteConfig, siteTitle } from "@/config/site";
import { createMetadata } from "@/lib/seo";
import { organizationSchema, structuredDataGraph, websiteSchema } from "@/lib/structured-data";

export const metadata: Metadata = createMetadata({
  title: { absolute: siteTitle },
  description: siteConfig.description,
  pathname: "/",
});

export default function Page() {
  return (
    <>
      <JsonLd data={structuredDataGraph(organizationSchema(), websiteSchema())} />

      <HeroSection />
      <LogosSection />
      <Channels />
      <FeatureSection1 />
      <FeatureSection2 />
      <CallToAction />
    </>
  );
}
