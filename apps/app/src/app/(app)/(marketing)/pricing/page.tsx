import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { plans } from "@/components/marketing/pricing/plans";
import { PricingSection } from "@/components/marketing/pricing/pricing-section";
import { siteConfig } from "@/config/site";
import { createMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  organizationSchema,
  softwareApplicationSchema,
  structuredDataGraph,
  webPageSchema,
  websiteSchema,
} from "@/lib/structured-data";

const title = "Pricing";
const description = `Simple, transparent pricing for ${siteConfig.name}. Compare the Basic, Pro and Business plans and pick the one that scales with your team.`;

export const metadata: Metadata = createMetadata({
  title,
  description,
  pathname: "/pricing",
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: title,
            description,
            pathname: "/pricing",
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: title, pathname: "/pricing" },
            ]),
          }),
          softwareApplicationSchema(
            plans.map((plan) => ({
              name: plan.name,
              description: plan.info,
              price: plan.price.monthly,
              billingDuration: "P1M",
            })),
          ),
        )}
      />

      <PricingSection />
    </>
  );
}
