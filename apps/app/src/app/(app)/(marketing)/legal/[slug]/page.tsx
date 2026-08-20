import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { JsonLd } from "@/components/json-ld";
import { LegalContact } from "@/components/legal-contact";
import { LegalDropdown } from "@/components/legal-dropdown";
import { siteConfig } from "@/config/site";
import { getLegalPage } from "@/lib/legal-pages";
import { richTextToPlainText } from "@/lib/rich-text";
import { createMetadata, truncateForDescription } from "@/lib/seo";
import {
  breadcrumbSchema,
  organizationSchema,
  structuredDataGraph,
  webPageSchema,
  websiteSchema,
} from "@/lib/structured-data";

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
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: page.title,
            description: summary
              ? truncateForDescription(summary)
              : `${page.title} for ${siteConfig.name}.`,
            pathname,
            datePublished: page.createdAt,
            dateModified: page.updatedAt,
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: page.title, pathname },
            ]),
          }),
        )}
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
