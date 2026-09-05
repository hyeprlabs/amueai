import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { ClockIcon, LockIcon, ShieldCheckIcon, TargetIcon } from "lucide-react";

import { CallToAction } from "@/components/marketing/cta";
import { FullWidthDivider } from "@/components/full-width-divider";
import { PageHero, SectionHeading } from "@/components/marketing/page-hero";
import { GridPattern } from "@/components/ui/grid-pattern";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata } from "@/lib/seo";

const title = "About Us";
const description = `Learn about ${siteConfig.name}’s mission to help every business turn their content into a 24/7 AI agent that answers questions, captures leads, and supports customers.`;
const pathname = "/about";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const facts = [
  { label: "Built by", value: siteConfig.publisher },
  { label: "Founded", value: "2025" },
  { label: "Where", value: "Remote" },
  { label: "Focus", value: "Support automation" },
];

const principles = [
  {
    title: "Grounded, not guessing",
    icon: <TargetIcon />,
    description: "Answers come from your content, or the agent says it does not know.",
  },
  {
    title: "Minutes, not quarters",
    icon: <ClockIcon />,
    description: "From first source to live agent in an afternoon.",
  },
  {
    title: "Built for the front line",
    icon: <ShieldCheckIcon />,
    description: "Designed for the people answering the same question all day.",
  },
  {
    title: "Your data stays yours",
    icon: <LockIcon />,
    description: "Your content trains your agent. Never a shared model.",
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

      <PageHero
        description={`${siteConfig.name} turns the content you already have into an agent that answers your customers the moment they ask.`}
        title="Your best support agent is already written down"
      />

      {/* Facts */}
      <div className="relative mb-12 lg:mb-24">
        <FullWidthDivider className="-top-px" />
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {facts.map((fact) => (
            <div className="bg-background px-3 py-6 text-center" key={fact.label}>
              <dt className="text-muted-foreground text-xs">{fact.label}</dt>
              <dd className="mt-1 text-balance font-medium text-sm md:text-base">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <FullWidthDivider className="-bottom-px" />
      </div>

      {/* Mission */}
      <section className="mb-12 lg:mb-24">
        <SectionHeading title="Our mission" />
        <div className="relative">
          <FullWidthDivider className="-top-px" />
          <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-3">
            <p className="bg-background p-6 font-light text-muted-foreground text-sm md:p-8">
              Most support questions have already been answered somewhere. In a help article, a
              policy page, a spec sheet.
            </p>
            <p className="bg-background p-6 text-foreground text-sm md:p-8">
              That knowledge just sits there while someone retypes the same reply for the hundredth
              time.
            </p>
            <p className="bg-background p-6 font-light text-muted-foreground text-sm md:p-8">
              We built {siteConfig.name} so it answers for itself, around the clock, in your words.
            </p>
          </div>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      {/* Principles */}
      <section className="mb-12 lg:mb-24">
        <SectionHeading title="What we believe" />
        <div className="relative">
          <FullWidthDivider className="-top-px" />
          <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle) => (
              <div className="relative overflow-hidden bg-background p-6" key={principle.title}>
                <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
                  <GridPattern
                    className="absolute inset-0 size-full stroke-foreground/20 opacity-80"
                    height={40}
                    width={40}
                    x={20}
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="relative [&_svg]:size-6 [&_svg]:text-foreground/75"
                >
                  {principle.icon}
                </div>
                <dt className="relative mt-10 text-balance text-sm md:text-base">
                  {principle.title}
                </dt>
                <dd className="relative z-20 mt-2 text-balance font-light text-muted-foreground text-xs">
                  {principle.description}
                </dd>
              </div>
            ))}
          </dl>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      <CallToAction />
    </>
  );
}
