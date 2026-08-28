import type { MarketingFaqItem } from "@/components/marketing/marketing-faq";
import { siteConfig } from "@/config/site";

/** Static FAQ for the pricing page — shared by the page's `<MarketingFaq>`, its `FAQPage` schema, and the markdown rendition served on Accept negotiation. */
export const pricingFaqItems: MarketingFaqItem[] = [
  {
    id: "billing-cycle",
    question: "Can I switch between monthly and yearly billing?",
    answer: `Yes. Every ${siteConfig.name} plan is available billed monthly or yearly, with a lower effective monthly rate on the yearly cycle.`,
  },
  {
    id: "plan-difference",
    question: "What's the difference between the Basic, Pro and Business plans?",
    answer:
      "Plans scale with usage and support level, from the Basic plan for individuals up to Business, which adds the highest usage limits and priority support.",
  },
  {
    id: "enterprise",
    question: "I need a custom plan for my organization — who do I talk to?",
    answer: `Reach out to ${siteConfig.email} and the team will help you find the right plan or a custom arrangement for your organization.`,
  },
];
