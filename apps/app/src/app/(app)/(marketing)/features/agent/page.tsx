import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import {
  ArrowRightIcon,
  BotIcon,
  CpuIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  LanguagesIcon,
  MessagesSquareIcon,
  PencilIcon,
  PlugIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  ZapIcon,
} from "lucide-react";

import { CallToAction } from "@/components/cta";
import { DecorIcon } from "@/components/decor-icon";
import { FeatureCard } from "@/components/feature-section-1";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
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

const steps = [
  {
    step: "01",
    title: "Add your sources",
    icon: <DatabaseIcon />,
    description:
      "Point the agent at your help center, upload PDFs and docs, paste raw text, or type Q&A pairs by hand. Everything lands in one knowledge base.",
  },
  {
    step: "02",
    title: "Train and test",
    icon: <SparklesIcon />,
    description:
      "We extract, chunk, and index every source automatically. Then you chat with your agent in the playground and tune its instructions until it sounds right.",
  },
  {
    step: "03",
    title: "Go live anywhere",
    icon: <RocketIcon />,
    description:
      "Drop one line of script onto your site and the agent is answering customers. Update a source and it retrains itself — no redeploy needed.",
  },
];

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
  {
    title: "Lead capture built in",
    icon: <UserPlusIcon />,
    description: "Collect and qualify leads inside the conversation, then hand them to your CRM.",
  },
  {
    title: "Speaks 90+ languages",
    icon: <LanguagesIcon />,
    description: "Ask in any language, get an answer in the same one — from the same sources.",
  },
  {
    title: "Deploy everywhere",
    icon: <PlugIcon />,
    description: "One agent, one knowledge base, live on your site and in your messaging channels.",
  },
];

const sources = [
  {
    label: "Websites",
    icon: <GlobeIcon />,
    description: "Crawl your marketing site, docs, or help center by URL.",
  },
  {
    label: "Files",
    icon: <FileTextIcon />,
    description: "Upload PDFs, Word documents, and plain text.",
  },
  {
    label: "Raw text",
    icon: <PencilIcon />,
    description: "Paste policies, scripts, or notes straight into the agent.",
  },
  {
    label: "Q&A pairs",
    icon: <MessagesSquareIcon />,
    description: "Write the exact answer to the questions you get most.",
  },
];

const transcript = [
  {
    role: "user" as const,
    text: "Do you ship to Germany, and how long does it take?",
  },
  {
    role: "agent" as const,
    text: "Yes — we ship to Germany with DHL. Standard delivery lands in 3–5 business days, express in 1–2.",
    source: "shipping-policy.pdf",
  },
  {
    role: "user" as const,
    text: "What's your CEO's home address?",
  },
  {
    role: "agent" as const,
    text: "I don't have that information. I can help with orders, shipping, and returns — want me to connect you with the team?",
  },
];

const stats = [
  { value: "< 1 min", label: "To train your first agent" },
  { value: "1 line", label: "Of code to embed it" },
  { value: "90+", label: "Languages supported" },
  { value: "24/7", label: "Always answering" },
];

const faqs = [
  {
    question: "What can I train my agent on?",
    answer:
      "Any content you own: website URLs, PDF and Word files, plain text you paste in, and Q&A pairs you write by hand. You can mix as many sources as you like inside a single agent, and add or remove them at any time.",
  },
  {
    question: "Will my agent make things up?",
    answer:
      "It's built not to. Every answer is grounded in the chunks retrieved from your own sources, and the default instructions tell the agent to say it doesn't know rather than guess. You can tighten or loosen that behaviour in the agent's settings.",
  },
  {
    question: "How do I put the agent on my website?",
    answer:
      "Copy the embed snippet from your dashboard and paste it into your site's HTML. The chat bubble appears in the corner of every page — no framework, no build step, and nothing for your visitors to install.",
  },
  {
    question: "What happens when I update my content?",
    answer:
      "Edit or re-add a source and that source retrains on its own. Only the changed source is reprocessed, so the rest of your agent's knowledge stays live the whole time.",
  },
  {
    question: "Which AI model does my agent use?",
    answer:
      "You choose. Each agent has a model setting, so you can pick a fast, inexpensive model for high-volume support and a stronger one for complex questions — and switch whenever you like.",
  },
  {
    question: "Can I see what people are asking?",
    answer:
      "Yes. Every conversation, from the widget and from the playground, is logged against the agent so you can read real questions, spot gaps in your content, and fill them.",
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
          { name: title, pathname },
        ])}
        scriptKey="breadcrumb"
      />
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }}
        scriptKey="faq"
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
          featureList: capabilities.map((capability) => capability.title),
        }}
        scriptKey="software"
      />

      {/* Hero */}
      <section className="relative flex flex-col items-center gap-5 px-4 py-16 text-center lg:py-24">
        <div aria-hidden="true" className="absolute inset-0 -z-10 size-full overflow-hidden">
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
        </div>

        <Badge className="gap-1.5" variant="outline">
          <BotIcon />
          Agent
        </Badge>

        <h1 className="max-w-2xl text-balance font-medium text-3xl md:text-5xl lg:text-6xl">
          A custom AI agent, trained on your data
        </h1>

        <p className="max-w-xl text-balance text-muted-foreground text-sm sm:text-lg">
          Turn your docs, website, and files into an agent that answers questions, captures leads,
          and supports customers — around the clock, in your voice.
        </p>

        <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row">
          <Button nativeButton={false} render={<Link href="/pricing" />}>
            See pricing
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button nativeButton={false} render={<Link href="/contact" />} variant="outline">
            Talk to us
          </Button>
        </div>
      </section>

      {/* Product shot */}
      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px border-b bg-border md:grid-cols-4">
        {stats.map((stat) => (
          <div className="bg-background px-4 py-6 text-center" key={stat.label}>
            <p className="font-medium text-2xl md:text-3xl">{stat.value}</p>
            <p className="mt-1 text-balance text-muted-foreground text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <section className="my-16 lg:my-24">
        <SectionHeading
          eyebrow="How it works"
          title="From your content to a live agent in three steps"
          description="No pipelines to wire up, no vector database to run. Add a source and the rest happens for you."
        />

        <div className="mt-10 grid grid-cols-1 gap-px border-y bg-border md:grid-cols-3">
          {steps.map((step) => (
            <div className="relative overflow-hidden bg-background p-6" key={step.step}>
              <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
                <GridPattern
                  className="absolute inset-0 size-full stroke-foreground/20 opacity-80"
                  height={40}
                  width={40}
                  x={20}
                />
              </div>
              <div className="relative flex items-center justify-between">
                <IconTile size="default" variant="frame">
                  {step.icon}
                </IconTile>
                <span className="font-medium font-mono text-muted-foreground/60 text-sm">
                  {step.step}
                </span>
              </div>
              <h3 className="relative z-10 mt-8 font-medium text-base">{step.title}</h3>
              <p className="relative z-10 mt-2 font-light text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Grounded answers — transcript */}
      <section className="my-16 border-y lg:my-24">
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
          <div className="flex flex-col justify-center bg-background p-6 md:p-10">
            <IconTile size="default" variant="frame">
              <ShieldCheckIcon />
            </IconTile>
            <h2 className="mt-6 text-balance font-medium text-2xl md:text-3xl">
              Answers from your content. Nothing else.
            </h2>
            <p className="mt-4 text-muted-foreground text-sm md:text-base">
              Every reply is grounded in the chunks retrieved from your own sources. When the answer
              genuinely isn't there, the agent says so and offers a way through to your team —
              instead of inventing a policy you never wrote.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Retrieval runs against your sources on every single message.",
                'Out-of-scope questions get an honest "I don\'t know".',
                "You control the tone and the guardrails in plain language.",
              ].map((point) => (
                <li className="flex items-start gap-2 text-muted-foreground" key={point}>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col justify-center gap-3 bg-background p-6 md:p-10 dark:bg-[radial-gradient(35%_80%_at_75%_0%,--theme(--color-foreground/.08),transparent)]">
            {transcript.map((message, index) => (
              <div
                className={cn(
                  "flex flex-col gap-1",
                  message.role === "user" ? "items-end" : "items-start",
                )}
                key={`${message.role}-${index}`}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg border px-3 py-2 text-sm shadow-xs",
                    message.role === "user"
                      ? "bg-muted/50 text-foreground"
                      : "bg-card text-foreground",
                  )}
                >
                  {message.text}
                </div>
                {message.source && (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <FileTextIcon className="size-3" />
                    {message.source}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="my-16 lg:my-24">
        <SectionHeading
          eyebrow="Knowledge"
          title="Train it on what you already have"
          description="Your agent's knowledge is whatever you give it — and you can change that at any time."
        />

        <div className="mt-10 grid grid-cols-1 gap-px border-y bg-border sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((source) => (
            <div className="bg-background p-6" key={source.label}>
              <IconTile size="sm" variant="frame">
                {source.icon}
              </IconTile>
              <h3 className="mt-4 font-medium text-sm">{source.label}</h3>
              <p className="mt-1 font-light text-muted-foreground text-xs">{source.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="my-16 lg:my-24">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything your agent needs"
          description="One agent, trained once, deployed everywhere your customers already are."
        />

        <div className="mt-10 overflow-hidden border-y">
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {capabilities.map((capability) => (
              <FeatureCard feature={capability} key={capability.title} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="my-16 lg:my-24">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />

        <div className="mx-auto mt-10 max-w-2xl px-4">
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="px-4">{faq.question}</AccordionTrigger>
                <AccordionContent className="px-4">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CallToAction />
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 text-center">
      <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-medium text-2xl md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
