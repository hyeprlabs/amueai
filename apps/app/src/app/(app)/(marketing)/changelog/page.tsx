import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { ChangelogSection } from "@/components/changelog/changelog-section";
import { MarketingPagination } from "@/components/marketing-pagination";
import { siteConfig } from "@/config/site";
import { getChanges } from "@/lib/changelog";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata, listPathname } from "@/lib/seo";

const title = "Changelog";
const description = `Everything we've shipped for ${siteConfig.name}: new features, improvements and fixes.`;

type ChangelogSearchParams = { page?: string };

const readPage = ({ page }: ChangelogSearchParams) => (Number(page) > 0 ? Number(page) : 1);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ChangelogSearchParams>;
}): Promise<Metadata> {
  const page = readPage(await searchParams);

  // Page two and beyond canonicalise to themselves rather than to page one.
  return createMetadata({
    title,
    description,
    pathname: listPathname("/changelog", page),
  });
}

export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<ChangelogSearchParams>;
}) {
  const page = readPage(await searchParams);

  const pathname = listPathname("/changelog", page);
  const { docs: changes, totalPages } = await getChanges({ page });

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
          { name: title, pathname: "/changelog" },
        ])}
        scriptKey="breadcrumb"
      />
      {changes.length > 0 && (
        <JsonLdScript
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: changes.map((change, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/changelog#${change.slug}`),
              name: change.title,
            })),
          }}
          scriptKey="itemlist"
        />
      )}

      <ChangelogSection changes={changes} description={description} title={title} />

      <MarketingPagination basePath="/changelog" page={page} totalPages={totalPages} />
    </>
  );
}
