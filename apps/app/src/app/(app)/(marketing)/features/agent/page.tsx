import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import {
  BotIcon,
  ZapIcon,
  CpuIcon,
  PencilIcon,
  ShieldCheckIcon,
  MessagesSquareIcon,
} from "lucide-react";

import { FeatureCard } from "@/components/feature-section-1";
import { CallToAction } from "@/components/cta";
import { FullWidthDivider } from "@/components/full-width-divider";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata } from "@/lib/seo";

const title = "AI Agent";
const description = `Build a custom AI agent trained on your own content that answers questions, captures leads, and supports customers 24/7 — powered by ${siteConfig.name}.`;
const pathname = "/features/agent";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const capabilities = [
  {
    title: "Trained on your data",
    icon: <BotIcon />,
    description:
      "Feed in docs, websites, and files — your agent only ever answers from that content.",
  },
  {
    title: "Instant answers",
    icon: <ZapIcon />,
    description: "Real-time, human-like responses so visitors never wait for a reply.",
  },
  {
    title: "Powerful AI models",
    icon: <CpuIcon />,
    description: "Power your agent with the latest models, or switch models any time.",
  },
  {
    title: "Custom branding",
    icon: <PencilIcon />,
    description: "Match your website's colors, logo, and tone in every conversation.",
  },
  {
    title: "Safe by default",
    icon: <ShieldCheckIcon />,
    description: 'Your agent says "I don\'t know" instead of making something up.',
  },
  {
    title: "Test before you go live",
    icon: <MessagesSquareIcon />,
    description: "Chat with your agent in a playground before it ever meets a customer.",
  },
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
          { name: "Features", pathname: "/features/agent" },
          { name: title, pathname },
        ])}
        scriptKey="breadcrumb"
      />

      <div className="border-t p-4 pt-12 pb-8 text-center lg:pt-20">
        <h1 className="mx-auto max-w-2xl text-balance font-medium text-3xl md:text-5xl">
          A custom AI agent, trained on your data
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground text-sm md:text-base">
          Turn your docs, website, and files into an agent that answers questions, captures leads,
          and supports customers — around the clock, in your voice.
        </p>
      </div>

      <div className="relative border-y">
        <FullWidthDivider className="-top-px" />
        <div className="overflow-hidden *:pointer-events-none *:aspect-auto *:select-none">
          <Image
            alt={`The ${siteConfig.name} dashboard showing an AI agent answering customer questions`}
            className="dark:hidden"
            height={992}
            sizes="(min-width: 1024px) 1024px, 100vw"
            src="/bg-light.png"
            width={1586}
          />
          <Image
            alt={`The ${siteConfig.name} dashboard showing an AI agent answering customer questions`}
            className="hidden dark:block"
            height={992}
            sizes="(min-width: 1024px) 1024px, 100vw"
            src="/bg-dark.png"
            width={1586}
          />
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>

      <div className="mx-auto my-12 w-full max-w-5xl lg:my-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-medium text-2xl md:text-4xl">
            Everything your agent needs
          </h2>
          <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
            One agent, trained once, deployed everywhere your customers already are.
          </p>
        </div>

        <div className="mt-8 overflow-hidden border-y">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {capabilities.map((capability) => (
              <FeatureCard feature={capability} key={capability.title} />
            ))}
          </div>
        </div>
      </div>

      <CallToAction />
    </>
  );
}
