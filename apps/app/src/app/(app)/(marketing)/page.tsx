import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { Channels } from "@/components/channels";
import { FeatureSection1 } from "@/components/feature-section-1";
import { FeatureSection2 } from "@/components/feature-section-2";
import { CallToAction } from "@/components/cta";

export default function Page() {
  return (
    <>
      <HeroSection />
      <LogosSection />
      <Channels />
      <FeatureSection1 />
      <FeatureSection2 />
      <CallToAction />
    </>
  );
}
