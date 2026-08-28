import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { BriefcaseIcon, LifeBuoyIcon, MailIcon, ScaleIcon, ShieldCheckIcon } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { CallToAction } from "@/components/cta";
import { GithubIcon } from "@/components/icons/github-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { XIcon } from "@/components/icons/x-icon";
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

const socials = [
  { label: "X", icon: <XIcon />, link: siteConfig.links.x },
  { label: "GitHub", icon: <GithubIcon />, link: siteConfig.links.github },
  { label: "Instagram", icon: <InstagramIcon />, link: siteConfig.links.instagram },
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

      {/* Hero */}
      <section className="px-4 py-12 sm:py-16 lg:py-20">
        <Badge variant="outline">Contact</Badge>
        <h1 className="mt-4 max-w-2xl text-balance font-medium text-3xl sm:text-4xl md:text-5xl">
          Talk to the people building {siteConfig.name}
        </h1>
        <p className="mt-4 max-w-xl text-balance text-muted-foreground text-sm sm:text-base">
          Questions about the product, a bug you've hit, or a rollout you're planning — send it over
          and someone on the team will get back to you.
        </p>
      </section>

      {/* Form + details */}
      <section className="grid grid-cols-1 gap-px border-y bg-border md:grid-cols-2">
        <div className="bg-background p-5 sm:p-8 lg:p-10">
          <h2 className="font-medium text-lg">Send us a message</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Fill this in and we'll pick it up from there.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <div className="flex flex-col gap-8 bg-background p-5 sm:p-8 lg:p-10 dark:bg-[radial-gradient(60%_80%_at_75%_0%,--theme(--color-foreground/.07),transparent)]">
          <div>
            <h2 className="font-medium text-lg">Prefer email?</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Everything reaches the same inbox, and we read all of it.
            </p>
            <a
              className="mt-4 flex w-max max-w-full items-center gap-2 break-all font-medium text-sm hover:underline"
              href={`mailto:${siteConfig.email}`}
            >
              <MailIcon className="size-4 shrink-0" />
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
                  <div className="min-w-0">
                    <dt className="font-medium text-sm">{route.label}</dt>
                    <dd className="mt-0.5 text-balance text-muted-foreground text-xs">
                      {route.description}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
              Elsewhere
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
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

      <div className="pt-12 sm:pt-16 lg:pt-20">
        <CallToAction />
      </div>
    </>
  );
}
