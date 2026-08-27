import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { MarketingPagination } from "@/components/marketing-pagination";
import { BlogSection } from "@/components/blog/blog-section";
import { siteConfig } from "@/config/site";
import { getCategories, getPosts, parsePageParam } from "@/lib/blog";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata, listPathname } from "@/lib/seo";

const title = "Blog";
const description = `Product updates, guides and stories from the ${siteConfig.name} team.`;

type BlogSearchParams = { category?: string; page?: string };

/** Normalises the query string once, for both the metadata and the page body. */
function readSearchParams({ category, page }: BlogSearchParams) {
  return { category, page: parsePageParam(page) };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}): Promise<Metadata> {
  const { category, page } = readSearchParams(await searchParams);
  const pathname = listPathname("/blog", page, { category });

  return {
    ...createMetadata({
      title,
      description,
      pathname,
    }),
    // Each filtered or deeper page canonicalises to itself, so none of them is
    // dropped as a duplicate of page one.
    alternates: {
      canonical: pathname,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
  };
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<BlogSearchParams>;
}) {
  const { category, page } = readSearchParams(await searchParams);

  const pathname = listPathname("/blog", page, { category });

  const [{ docs: posts, totalPages }, categories] = await Promise.all([
    getPosts({ page, category }),
    getCategories(),
  ]);

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
          { name: title, pathname: "/blog" },
        ])}
        scriptKey="breadcrumb"
      />

      <BlogSection
        activeCategorySlug={category}
        categories={categories}
        description={description}
        posts={posts}
        title={title}
      />

      <MarketingPagination
        basePath="/blog"
        page={page}
        params={{ category }}
        totalPages={totalPages}
      />
    </>
  );
}
