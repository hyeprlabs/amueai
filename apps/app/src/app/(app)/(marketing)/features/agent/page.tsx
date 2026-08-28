import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { ArrowRightIcon, BotIcon, DatabaseIcon, RocketIcon, ShieldCheckIcon } from "lucide-react";

import { AgentCapabilities } from "@/components/agent/agent-capabilities";
import { EmbedGraphic } from "@/components/agent/embed-graphic";
import { FeatureRow } from "@/components/agent/feature-row";
import { GroundedChat } from "@/components/agent/grounded-chat";
import { KnowledgeGraphic } from "@/components/agent/knowledge-graphic";
import { CallToAction } from "@/components/cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

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

      {/* Hero */}
      <section className="relative flex flex-col items-center gap-4 px-4 py-14 text-center sm:py-20 lg:py-24">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
        </div>

        <Badge
          className={cn("gap-1.5", "fade-in animate-in fill-mode-backwards duration-500 ease-out")}
          variant="outline"
        >
          <BotIcon />
          Agent
        </Badge>

        <h1
          className={cn(
            "max-w-2xl text-balance font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
            "fade-in slide-in-from-bottom-6 animate-in fill-mode-backwards delay-100 duration-500 ease-out",
          )}
        >
          An AI agent that only knows your business
        </h1>

        <p
          className={cn(
            "max-w-md text-balance text-muted-foreground text-sm sm:text-base",
            "fade-in slide-in-from-bottom-6 animate-in fill-mode-backwards delay-200 duration-500 ease-out",
          )}
        >
          Add your content. Get an agent that answers from it — and nothing else.
        </p>

        <div className="fade-in slide-in-from-bottom-6 flex w-full animate-in flex-col items-center gap-2 fill-mode-backwards pt-2 delay-300 duration-500 ease-out sm:w-auto sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            nativeButton={false}
            render={<Link href="/pricing" />}
          >
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
        </div>
      </section>

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div className="bg-background px-3 py-5 text-center sm:py-6" key={stat.label}>
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block font-medium text-xl sm:text-2xl md:text-3xl">
                {stat.value}
              </span>
              <span aria-hidden="true" className="mt-1 block text-muted-foreground text-xs">
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {/* Illustrated feature bands */}
      <div className="divide-y">
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

      {/* Capabilities */}
      <section className="border-t">
        <AgentCapabilities />
      </section>

      <CallToAction />
    </>
  );
}
