import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import {
  ArrowRightIcon,
  MessagesSquareIcon,
  PlugIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";

import { CallToAction } from "@/components/cta";
import { ChannelsFeatures } from "@/components/channels/channels-features";
import { CapabilityStrip } from "@/components/marketing/capability-strip";
import { PageHero } from "@/components/marketing/page-hero";
import { StatStrip } from "@/components/marketing/stat-strip";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const title = "Channels";
const description = `Deploy the same AI agent across your website, WhatsApp, and more, all trained once and answering everywhere with ${siteConfig.name}.`;
const pathname = "/features/channels";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const stats = [
  { value: "1", label: "Agent to train" },
  { value: "4+", label: "Channels" },
  { value: "1 line", label: "To embed" },
  { value: "24/7", label: "Answering" },
];

const capabilities = [
  { label: "One shared knowledge base", icon: <ZapIcon /> },
  { label: "Consistent answers everywhere", icon: <ShieldCheckIcon /> },
  { label: "New channels, no retraining", icon: <PlugIcon /> },
  { label: "One conversation log", icon: <MessagesSquareIcon /> },
];

export default function ChannelsFeaturePage() {
  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({ name: title, description, pathname })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname },
        ])}
        scriptKey="breadcrumb"
      />
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: `${siteConfig.name} Channels`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: absoluteUrl(pathname),
          description,
        }}
        scriptKey="software"
      />

      <PageHero
        description="One agent, trained once, live on your website and in the apps your customers already use."
        title="Deploy your agent everywhere at once"
      >
        <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/pricing" />}>
          See pricing
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href="/features/agent" />}
          variant="outline"
        >
          Explore the agent
        </Button>
      </PageHero>

      <StatStrip stats={stats} />

      <ChannelsFeatures />

      <CapabilityStrip
        description="Every channel draws from the same trained agent."
        items={capabilities}
        title="One agent behind all of it"
      />

      <CallToAction />
    </>
  );
}
