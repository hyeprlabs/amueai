import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { CompetitorsSection } from "@/components/marketing/pages/competitors/competitors-section";
import { MarketingPagination } from "@/components/marketing/marketing-pagination";
import { siteConfig } from "@/config/site";
import { competitorPageTitle, getCompetitors } from "@/lib/competitors";
import {
  breadcrumbItems,
  itemListJsonLd,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata, listPathname } from "@/lib/seo";

const title = "Competitors";
const description = `How ${siteConfig.name} compares to every other AI agent platform: pricing, setup, channels and support, side by side.`;

type CompetitorsSearchParams = { page?: string };

const readPage = ({ page }: CompetitorsSearchParams) => (Number(page) > 0 ? Number(page) : 1);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CompetitorsSearchParams>;
}): Promise<Metadata> {
  const page = readPage(await searchParams);

  // Page two and beyond canonicalise to themselves rather than to page one.
  return createMetadata({
    title,
    description,
    pathname: listPathname("/competitors", page),
  });
}

export default async function CompetitorsPage({
  searchParams,
}: {
  searchParams: Promise<CompetitorsSearchParams>;
}) {
  const page = readPage(await searchParams);

  const pathname = listPathname("/competitors", page);
  const { docs: competitors, totalPages } = await getCompetitors({ page });

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({
          name: title,
          description,
          pathname,
          type: "CollectionPage",
        })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname: "/competitors" },
        ])}
        scriptKey="breadcrumb"
      />
      {competitors.length > 0 && (
        <JsonLdScript
          data={itemListJsonLd(
            `${siteConfig.name} comparisons`,
            competitors.map((competitor) => ({
              name: competitorPageTitle(competitor.name),
              pathname: `/vs/${competitor.slug}`,
            })),
          )}
          scriptKey="itemlist"
        />
      )}

      <CompetitorsSection competitors={competitors} description={description} title={title} />

      <MarketingPagination basePath="/competitors" page={page} totalPages={totalPages} />
    </>
  );
}
