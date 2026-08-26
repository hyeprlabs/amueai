import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { ChangelogSection } from "@/components/changelog/changelog-section";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { siteConfig } from "@/config/site";
import { getChangelogEntries } from "@/lib/changelog";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const title = "Changelog";
const description = `Everything we've shipped for ${siteConfig.name}: new features, improvements and fixes.`;

export const metadata: Metadata = createMetadata({
  title,
  description,
  pathname: "/changelog",
});

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;

  const { docs: entries, totalPages } = await getChangelogEntries({ page });

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({ name: title, description, pathname: "/changelog" })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname: "/changelog" },
        ])}
        scriptKey="breadcrumb"
      />
      {entries.length > 0 && (
        <JsonLdScript
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: entries.map((entry, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/changelog#${entry.slug}`),
              name: entry.title,
            })),
          }}
          scriptKey="itemlist"
        />
      )}

      <ChangelogSection description={description} entries={entries} title={title} />

      <BlogPagination basePath="/changelog" page={page} totalPages={totalPages} />
    </>
  );
}
