import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";

import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogSection } from "@/components/blog/blog-section";
import { siteConfig } from "@/config/site";
import { getCategories, getPosts } from "@/lib/blog";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { createMetadata } from "@/lib/seo";

const title = "Latest Blogs";
const description = `Product updates, guides and stories from the ${siteConfig.name} team.`;

export const metadata: Metadata = {
  ...createMetadata({
    title,
    description,
    pathname: "/blog",
  }),
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page: pageParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;

  const [{ docs: posts, totalPages }, categories] = await Promise.all([
    getPosts({ page, category }),
    getCategories(),
  ]);

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({ name: title, description, pathname: "/blog" })}
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

      <BlogPagination basePath="/blog" page={page} params={{ category }} totalPages={totalPages} />
    </>
  );
}
