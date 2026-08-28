import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
} from "next-seo";

import { plans } from "@/components/marketing/pricing/plans";
import { PricingSection } from "@/components/marketing/pricing/pricing-section";
import {
  MarketingFaq,
  type MarketingFaqItem,
} from "@/components/marketing/marketing-faq";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  faqPageJsonLd,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const title = "Pricing";
const description = `Simple, transparent pricing for ${siteConfig.name}. Compare the Basic, Pro and Business plans and pick the one that scales with your team.`;

export const metadata: Metadata = createMetadata({
  title,
  description,
  pathname: "/pricing",
});

const pricingFaqItems: MarketingFaqItem[] = [
  {
    id: "billing-cycle",
    question: "Can I switch between monthly and yearly billing?",
    answer: `Yes. Every ${siteConfig.name} plan is available billed monthly or yearly, with a lower effective monthly rate on the yearly cycle.`,
  },
  {
    id: "plan-difference",
    question:
      "What's the difference between the Basic, Pro and Business plans?",
    answer:
      "Plans scale with usage and support level, from the Basic plan for individuals up to Business, which adds the highest usage limits and priority support.",
  },
  {
    id: "enterprise",
    question: "I need a custom plan for my organization — who do I talk to?",
    answer: `Reach out to ${siteConfig.email} and the team will help you find the right plan or a custom arrangement for your organization.`,
  },
];

export default function Page() {
  return (
    <>
      <OrganizationJsonLd
        {...organizationJsonLdProps()}
        scriptKey="organization"
      />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({ name: title, description, pathname: "/pricing" })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname: "/pricing" },
        ])}
        scriptKey="breadcrumb"
      />
      <SoftwareApplicationJsonLd
        applicationCategory="BusinessApplication"
        description={siteConfig.description}
        name={siteConfig.name}
        offers={plans.map((plan) => ({
          price: plan.price.monthly,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: absoluteUrl("/pricing"),
        }))}
        operatingSystem="Web"
        scriptKey="software-application"
        url={absoluteUrl("/pricing")}
      />
      <JsonLdScript data={faqPageJsonLd(pricingFaqItems)} scriptKey="faq" />

      <PricingSection />
      <MarketingFaq items={pricingFaqItems} />
    </>
  );
}
