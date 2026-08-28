import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { ArrowRightIcon, DatabaseIcon, RocketIcon, ShieldCheckIcon } from "lucide-react";

import { AgentCapabilities } from "@/components/agent/agent-capabilities";
import { EmbedGraphic } from "@/components/agent/embed-graphic";
import { FeatureRow } from "@/components/agent/feature-row";
import { GroundedChat } from "@/components/agent/grounded-chat";
import { KnowledgeGraphic } from "@/components/agent/knowledge-graphic";
import { CallToAction } from "@/components/cta";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { PageHero } from "@/components/marketing/page-hero";
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
const description = `Build a custom AI agent trained on your own content that answers questions, captures leads, and supports customers 24/7 — powered by ${siteConfig.name}.`;
const pathname = "/features/agent";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const stats = [
  { value: "< 1 min", label: "To train" },
  { value: "1 line", label: "To embed" },
  { value: "90+", label: "Languages" },
  { value: "24/7", label: "Answering" },
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
        align="center"
        badge="Agent"
        description="Add your content. Get an agent that answers from it — and nothing else."
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

      {/* Stats */}
      <div className="relative mb-12 lg:mb-24">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {stats.map((stat) => (
            <div className="bg-background px-3 py-6 text-center" key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-medium text-2xl md:text-3xl">{stat.value}</span>
                <span aria-hidden="true" className="mt-1 block text-muted-foreground text-xs">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <FullWidthDivider className="-bottom-px" />
      </div>

      {/* Illustrated bands */}
      <div className="relative mb-12 lg:mb-24">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <div className="grid gap-px bg-border">
          <FeatureRow
            description="Websites, PDFs, docs, or plain text. Add a source and it's indexed in seconds."
            icon={<DatabaseIcon />}
            title="Train it on what you already have"
          >
            <KnowledgeGraphic />
          </FeatureRow>

          <FeatureRow
            description="Every reply is pulled from your sources and cited. No source, no answer."
            icon={<ShieldCheckIcon />}
            reverse
            title="It never makes things up"
          >
            <GroundedChat />
          </FeatureRow>

          <FeatureRow
            description="Paste one script tag. The chat bubble is live on every page."
            icon={<RocketIcon />}
            title="Live on your site in a minute"
          >
            <EmbedGraphic />
          </FeatureRow>
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>

      <AgentCapabilities />

      <CallToAction />
    </>
  );
}
