import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { MailIcon } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata } from "@/lib/seo";

const title = "Contact";
const description = `Get in touch with the ${siteConfig.name} team — questions, feedback, or support, we'd love to hear from you.`;
const pathname = "/contact";

export const metadata: Metadata = createMetadata({ title, description, pathname });

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

      <article className="my-12 flex flex-col gap-8 border-t p-4 sm:flex-row sm:gap-12 lg:my-24">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Contact us</h1>
          <p className="mt-4 max-w-sm text-balance text-muted-foreground text-sm md:text-base">
            Questions about {siteConfig.name}, feedback, or just want to say hi? Send us a message
            and we'll get back to you as soon as we can.
          </p>
          <a
            className="mt-6 flex w-max items-center gap-2 text-sm hover:underline"
            href={`mailto:${siteConfig.email}`}
          >
            <MailIcon className="size-4" />
            {siteConfig.email}
          </a>
        </div>

        <div className="flex-1">
          <ContactForm />
        </div>
      </article>
    </>
  );
}
