import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import {
  ArrowRightIcon,
  CpuIcon,
  FlaskConicalIcon,
  LanguagesIcon,
  PencilIcon,
  PlugIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ZapIcon,
} from "lucide-react";

import { AgentFeatures } from "@/components/agent/agent-features";
import { CallToAction } from "@/components/marketing/cta";
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

const title = "AI Agent";
const description = `Build a custom AI agent trained on your own content that answers questions, captures leads, and supports customers 24/7 with ${siteConfig.name}.`;
const pathname = "/features/agent";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const stats = [
  { value: "< 1 min", label: "To train" },
  { value: "1 line", label: "To embed" },
  { value: "90+", label: "Languages" },
  { value: "24/7", label: "Answering" },
];

const capabilities = [
  { label: "Instant answers", icon: <ZapIcon /> },
  { label: "Your choice of model", icon: <CpuIcon /> },
  { label: "Won't invent answers", icon: <ShieldCheckIcon /> },
  { label: "Your branding", icon: <PencilIcon /> },
  { label: "Lead capture", icon: <UserPlusIcon /> },
  { label: "90+ languages", icon: <LanguagesIcon /> },
  { label: "Test playground", icon: <FlaskConicalIcon /> },
  { label: "Every channel", icon: <PlugIcon /> },
];

export default function AgentFeaturePage() {
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
          name: `${siteConfig.name} AI Agent`,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: absoluteUrl(pathname),
          description,
        }}
        scriptKey="software"
      />

      <PageHero
        description="Add your content. Get an agent that answers from it, and nothing else."
        title="An AI agent that only knows your business"
      >
        <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/pricing" />}>
          See pricing
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href="/contact" />}
          variant="outline"
        >
          Talk to us
        </Button>
      </PageHero>

      <StatStrip stats={stats} />

      <AgentFeatures />

      <CapabilityStrip
        description="The rest of what your agent can do, out of the box."
        items={capabilities}
        title="And everything else"
      />

      <CallToAction />
    </>
  );
}
