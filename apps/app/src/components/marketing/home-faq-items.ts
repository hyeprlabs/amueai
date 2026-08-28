import type { MarketingFaqItem } from "@/components/marketing/marketing-faq";
import { siteConfig } from "@/config/site";

/**
 * Static FAQ for the home page. Answers restate facts already published
 * elsewhere on the site (agent feature page, channels section) so nothing
 * here can drift into an unsupported claim.
 *
 * Rendered by `<MarketingFaq>` and published as `FAQPage` structured data via
 * `faqPageJsonLd` — same source, so copy and schema can't diverge.
 */
export const homeFaqItems: MarketingFaqItem[] = [
  {
    id: "what-is",
    question: `What is ${siteConfig.name}?`,
    answer: `${siteConfig.name} is a platform for training a custom AI agent on your own content — documents, help center articles, and web pages — so it can answer questions, capture leads, and support customers around the clock.`,
  },
  {
    id: "how-it-works",
    question: "How does training an agent work?",
    answer:
      "You upload or connect your content, the agent indexes it as its knowledge base, and it starts answering from that content in under a minute. There's no model fine-tuning required.",
  },
  {
    id: "hallucination",
    question: "Will the agent make up answers it doesn't know?",
    answer:
      "No. The agent is scoped to the content you train it on and is designed to say when it doesn't know something rather than invent an answer.",
  },
  {
    id: "channels",
    question: `Where can I deploy my ${siteConfig.name} agent?`,
    answer:
      "Embed it on your website with one line of code, connect it to WhatsApp, or reach it through the API. Instagram and iMessage support are coming soon.",
  },
  {
    id: "languages",
    question: "What languages does the agent support?",
    answer:
      "The agent understands and responds in 90+ languages, so it can support customers in their own language without extra setup.",
  },
  {
    id: "customization",
    question: "Can I customize how the agent looks and which model it uses?",
    answer:
      "Yes. You can match the widget to your brand and choose which underlying AI model powers the agent's responses.",
  },
];
