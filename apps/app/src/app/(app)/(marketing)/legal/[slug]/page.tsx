import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { LegalContact } from "@/components/marketing/legal-contact";
import { LegalDropdown } from "@/components/marketing/legal-dropdown";
import { siteConfig } from "@/config/site";
import { getLegalPage } from "@/lib/legal-pages";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { richTextToPlainText } from "@/lib/rich-text";
import { createMetadata, truncateForDescription } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);

  if (!page) {
    return createMetadata({
      title: "Page not found",
      description: "The legal page you are looking for does not exist or has been moved.",
      pathname: `/legal/${slug}`,
      noIndex: true,
    });
  }

  const summary = richTextToPlainText(page.content);

  return createMetadata({
    title: page.title,
    description: summary
      ? truncateForDescription(summary)
      : `${page.title} for ${siteConfig.name}.`,
    pathname: `/legal/${page.slug}`,
    article: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
    },
  });
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = await getLegalPage(slug);

  if (!page) notFound();

  const pathname = `/legal/${page.slug}`;
  const summary = richTextToPlainText(page.content);

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({
          name: page.title,
          description: summary
            ? truncateForDescription(summary)
            : `${page.title} for ${siteConfig.name}.`,
          pathname,
          datePublished: page.createdAt,
          dateModified: page.updatedAt,
        })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: page.title, pathname },
        ])}
        scriptKey="breadcrumb"
      />

      <article className="my-12 lg:my-24">
        <div className="flex flex-col items-start gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{page.title}</h1>
          <LegalDropdown />
        </div>

        <RichText className="border-y p-4" data={page.content} />

        <p className="p-4 text-muted-foreground text-sm">
          Last updated{" "}
          <time dateTime={page.updatedAt}>
            {new Date(page.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </p>
      </article>
      <LegalContact />
    </>
  );
}
