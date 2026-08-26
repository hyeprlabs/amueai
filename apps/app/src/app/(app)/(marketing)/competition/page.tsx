import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { CompetitionSection } from "@/components/competition/competition-section";
import { MarketingPagination } from "@/components/marketing-pagination";
import { siteConfig } from "@/config/site";
import { getCompetitors } from "@/lib/competitors";
import {
  breadcrumbItems,
  itemListJsonLd,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata, listPathname, listTitle } from "@/lib/seo";

const title = "Competition";
const description = `How ${siteConfig.name} compares to every other AI agent platform — pricing, setup, channels and support, side by side.`;

type CompetitionSearchParams = { page?: string };

const readPage = ({ page }: CompetitionSearchParams) => (Number(page) > 0 ? Number(page) : 1);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CompetitionSearchParams>;
}): Promise<Metadata> {
  const page = readPage(await searchParams);

  // Page two and beyond canonicalise to themselves rather than to page one.
  return createMetadata({
    title: listTitle(title, page),
    description,
    pathname: listPathname("/competition", page),
  });
}

export default async function CompetitionPage({
  searchParams,
}: {
  searchParams: Promise<CompetitionSearchParams>;
}) {
  const page = readPage(await searchParams);

  const pathname = listPathname("/competition", page);
  const { docs: competitors, totalPages } = await getCompetitors({ page });

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({
          name: listTitle(title, page),
          description,
          pathname,
          type: "CollectionPage",
        })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname: "/competition" },
        ])}
        scriptKey="breadcrumb"
      />
      {competitors.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            `${siteConfig.name} comparisons`,
            competitors.map((competitor) => ({
              name: `${siteConfig.name} vs ${competitor.name}`,
              pathname: `/vs/${competitor.slug}`,
            })),
          )}
          scriptKey="itemlist"
        />
      )}

      <CompetitionSection competitors={competitors} description={description} title={title} />

      <MarketingPagination basePath="/competition" page={page} totalPages={totalPages} />
    </>
  );
}
