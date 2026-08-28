import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { CallToAction } from "@/components/cta";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Badge } from "@/components/ui/badge";
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

const principles = [
  {
    title: "Grounded, not guessing",
    description:
      "An agent that invents an answer is worse than no agent at all. Ours answer from your content or admit they don't know.",
  },
  {
    title: "Minutes, not quarters",
    description:
      "Adding a source and going live should take an afternoon. Every decision we make is measured against that.",
  },
  {
    title: "Built for the front line",
    description:
      "We design for the person answering the same question for the hundredth time, not for the org chart above them.",
  },
  {
    title: "Your data stays yours",
    description:
      "Your content trains your agent and nothing else. It is never folded into a shared model.",
  },
];

const facts = [
  { label: "Built by", value: siteConfig.publisher },
  { label: "Founded", value: "2025" },
  { label: "Where", value: "Remote" },
  { label: "Focus", value: "Support automation" },
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

      {/* Hero */}
      <section className="px-4 py-12 sm:py-14 lg:py-16">
        <Badge variant="outline">About</Badge>
        <h1 className="mt-4 max-w-2xl text-balance font-medium text-3xl sm:text-4xl md:text-5xl">
          Your best support agent is already written down.
        </h1>
        <p className="mt-4 max-w-xl text-balance text-muted-foreground text-sm sm:text-base">
          {siteConfig.name} turns the content you already have — help articles, policies, product
          docs — into an agent that answers your customers the moment they ask.
        </p>
      </section>

      <AboutSection label="Our mission">
        <div className="space-y-4 text-muted-foreground text-sm sm:text-base">
          <p>
            Most support questions have already been answered somewhere — in a help center article,
            a shipping policy, a spec sheet. That knowledge just sits there while a person retypes
            the same reply for the hundredth time.
          </p>
          <p className="text-foreground">
            We built {siteConfig.name} so that knowledge answers for itself.
          </p>
          <p>
            Point an agent at your content and it becomes a teammate that never sleeps, never
            forgets, and never makes something up. When it doesn't know, it says so.
          </p>
        </div>
      </AboutSection>

      <AboutSection label="What we believe">
        <dl className="grid gap-5 sm:grid-cols-2 sm:gap-x-8">
          {principles.map((principle) => (
            <div key={principle.title}>
              <dt className="font-medium text-sm sm:text-base">{principle.title}</dt>
              <dd className="mt-1.5 text-balance text-muted-foreground text-sm">
                {principle.description}
              </dd>
            </div>
          ))}
        </dl>
      </AboutSection>

      <AboutSection label="The company">
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-muted-foreground text-xs">{fact.label}</dt>
              <dd className="mt-1 font-medium text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </AboutSection>

      <div className="pt-12 sm:pt-14 lg:pt-16">
        <CallToAction />
      </div>
    </>
  );
}

/** Label in a narrow left column, content in the wide one; stacked on mobile. */
function AboutSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="relative px-4 py-10 sm:py-12">
      <FullWidthDivider className="-top-px" />
      <div className="grid gap-4 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-10">
        <h2 className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
          {label}
        </h2>
        <div className="max-w-2xl">{children}</div>
      </div>
    </section>
  );
}
