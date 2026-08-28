import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClockIcon,
  LifeBuoyIcon,
  MailIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { GithubIcon } from "@/components/icons/github-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { XIcon } from "@/components/icons/x-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
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
import { createMetadata } from "@/lib/seo";

const title = "Contact";
const description = `Get in touch with the ${siteConfig.name} team — support, sales, press, or privacy. We read every message and reply within one business day.`;
const pathname = "/contact";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const routes = [
  {
    label: "Support",
    icon: <LifeBuoyIcon />,
    description: "Something not working, or a question about your agent.",
  },
  {
    label: "Sales",
    icon: <BriefcaseIcon />,
    description: "Volumes, rollout, or whether we're the right fit for your team.",
  },
  {
    label: "Privacy & security",
    icon: <ShieldCheckIcon />,
    description: "Data handling, processing agreements, and security questions.",
  },
  {
    label: "Press & partnerships",
    icon: <ScaleIcon />,
    description: "Media requests, integrations, and everything in between.",
  },
];

const expectations = [
  {
    title: "One business day",
    icon: <ClockIcon />,
    description:
      "That's our target for a first reply on every message, support and sales alike. Weekends roll into Monday.",
  },
  {
    title: "A person, every time",
    icon: <MailIcon />,
    description:
      "Nothing here goes into a ticket queue to be auto-closed. Someone on the team reads it and answers it.",
  },
  {
    title: "Context helps",
    icon: <BookOpenIcon />,
    description:
      "If it's a bug, the agent name and what you expected to happen gets us to an answer far faster.",
  },
];

const socials = [
  { label: "X", icon: <XIcon />, link: siteConfig.links.x },
  { label: "GitHub", icon: <GithubIcon />, link: siteConfig.links.github },
  { label: "Instagram", icon: <InstagramIcon />, link: siteConfig.links.instagram },
];

const faqs = [
  {
    question: "How quickly will I hear back?",
    answer:
      "We aim to reply to every message within one business day. Messages that arrive over the weekend are answered on Monday.",
  },
  {
    question: "I found a bug. What should I include?",
    answer:
      "The name of the agent, what you were doing, what you expected, and what happened instead. A screenshot or the exact question you asked the agent is usually enough for us to reproduce it.",
  },
  {
    question: "Can I get a data processing agreement?",
    answer:
      "Yes. Mention it in your message and we'll send one over. Our standard DPA is also published on the legal pages linked in the footer.",
  },
  {
    question: "Do you offer help setting up my first agent?",
    answer:
      "We do. Tell us what content you want the agent trained on and roughly what you want it to handle, and we'll walk you through the setup.",
  },
];

export default function ContactPage() {
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
          "@type": "ContactPage",
          name: title,
          description,
          mainEntity: {
            "@type": "Organization",
            name: siteConfig.name,
            email: siteConfig.email,
            contactPoint: routes.map((route) => ({
              "@type": "ContactPoint",
              contactType: route.label,
              email: siteConfig.email,
              availableLanguage: "English",
            })),
          },
        }}
        scriptKey="contactpage"
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

      {/* Hero */}
      <section className="px-4 py-16 lg:py-24">
        <Badge variant="outline">Contact</Badge>
        <h1 className="mt-5 max-w-2xl text-balance font-medium text-3xl md:text-5xl">
          Talk to the people building {siteConfig.name}
        </h1>
        <p className="mt-6 max-w-xl text-balance text-muted-foreground text-sm sm:text-lg">
          Questions about the product, a bug you've hit, or a rollout you're planning — send it over
          and someone on the team will get back to you.
        </p>
      </section>

      {/* Form + details */}
      <section className="relative grid grid-cols-1 gap-px border-y bg-border md:grid-cols-2">
        <div className="bg-background p-6 md:p-10">
          <h2 className="font-medium text-lg">Send us a message</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Fill this in and we'll pick it up from there.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <div className="flex flex-col gap-8 bg-background p-6 md:p-10 dark:bg-[radial-gradient(35%_80%_at_75%_0%,--theme(--color-foreground/.08),transparent)]">
          <div>
            <h2 className="font-medium text-lg">Prefer email?</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Everything reaches the same inbox, and we read all of it.
            </p>
            <a
              className="mt-4 flex w-max items-center gap-2 font-medium text-sm hover:underline"
              href={`mailto:${siteConfig.email}`}
            >
              <MailIcon className="size-4" />
              {siteConfig.email}
            </a>
          </div>

          <div>
            <h3 className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
              What we can help with
            </h3>
            <dl className="mt-4 space-y-5">
              {routes.map((route) => (
                <div className="flex items-start gap-3" key={route.label}>
                  <IconTile size="sm" variant="frame">
                    {route.icon}
                  </IconTile>
                  <div>
                    <dt className="font-medium text-sm">{route.label}</dt>
                    <dd className="mt-0.5 text-muted-foreground text-xs">{route.description}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
              Elsewhere
            </h3>
            <div className="mt-3 flex gap-2">
              {socials.map((social) => (
                <Button
                  aria-label={`${siteConfig.name} on ${social.label}`}
                  key={social.label}
                  nativeButton={false}
                  render={<a href={social.link} rel="noopener noreferrer" target="_blank" />}
                  size="icon"
                  variant="outline"
                >
                  {social.icon}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="my-16 lg:my-24">
        <div className="px-4">
          <h2 className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            What to expect
          </h2>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-px border-y bg-border md:grid-cols-3">
          {expectations.map((item) => (
            <div className="bg-background p-6" key={item.title}>
              <IconTile size="sm" variant="frame">
                {item.icon}
              </IconTile>
              <h3 className="mt-4 font-medium text-sm">{item.title}</h3>
              <p className="mt-2 font-light text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="my-16 lg:my-24">
        <div className="px-4">
          <h2 className="font-mono text-muted-foreground text-xs uppercase tracking-widest">FAQ</h2>
        </div>
        <div className="mt-6 px-4">
          <Accordion className="mx-auto max-w-2xl">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="px-4">{faq.question}</AccordionTrigger>
                <AccordionContent className="px-4">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Closing */}
      <section className="relative flex flex-col items-start gap-4 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
        <FullWidthDivider className="-top-px" />
        <div>
          <h2 className="text-balance font-medium text-xl md:text-2xl">
            Not sure what you need yet?
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Have a look at what an agent can actually do first.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/features/agent" />}>
          Explore the agent
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>
    </>
  );
}
