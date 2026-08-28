import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { TargetIcon, HeartHandshakeIcon, RocketIcon, ShieldCheckIcon } from "lucide-react";

import { FeatureCard } from "@/components/feature-section-1";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata } from "@/lib/seo";

const title = "About Us";
const description = `Learn about ${siteConfig.name}'s mission to help every business turn their content into a 24/7 AI agent that answers questions, captures leads, and supports customers.`;
const pathname = "/about";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const values = [
  {
    title: "Answers you can trust",
    icon: <TargetIcon />,
    description:
      "Our agents only ever answer from the content you give them — no guessing, no made-up answers.",
  },
  {
    title: "Built for support teams",
    icon: <HeartHandshakeIcon />,
    description:
      "We design every feature around the people who actually field customer questions all day.",
  },
  {
    title: "Ship fast, iterate often",
    icon: <RocketIcon />,
    description: "A new agent should go from idea to live on your site in minutes, not weeks.",
  },
  {
    title: "Privacy by default",
    icon: <ShieldCheckIcon />,
    description:
      "Your data trains your agent and nothing else. It's never used to train shared models.",
  },
];

export default function AboutPage() {
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

      <article className="my-12 lg:my-24">
        <div className="border-t p-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            About {siteConfig.name}
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-muted-foreground text-sm md:text-base">
            {siteConfig.name} helps businesses turn their existing content — docs, websites, and
            files — into a custom AI agent that answers questions, captures leads, and supports
            customers around the clock.
          </p>
        </div>

        <div className="border-y p-4">
          <h2 className="font-medium text-lg">Our mission</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm md:text-base">
            Most support questions have already been answered somewhere — in a help center article,
            a policy page, a spec sheet. We built {siteConfig.name} so that knowledge doesn't have
            to sit unused. Point an agent at your content, and it becomes a teammate that never
            sleeps, never forgets, and never makes something up.
          </p>
        </div>

        <div className="overflow-hidden border-b">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
            {values.map((value) => (
              <FeatureCard feature={value} key={value.title} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium text-lg">Want to get in touch?</h2>
            <p className="mt-1 text-muted-foreground text-sm">We'd love to hear from you.</p>
          </div>
          <Button nativeButton={false} render={<Link href="/contact" />}>
            Contact us
          </Button>
        </div>
      </article>
    </>
  );
}
