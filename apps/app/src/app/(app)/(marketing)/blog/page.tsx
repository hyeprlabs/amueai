import type { Metadata } from "next";

import { BlogSection } from "@/components/blog/blog-section";
import { Pager } from "@/components/blog/pager";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/config/site";
import { getCategories, getPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  organizationSchema,
  structuredDataGraph,
  webPageSchema,
  websiteSchema,
} from "@/lib/structured-data";

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

  const [{ docs: posts, hasNextPage, hasPrevPage }, categories] = await Promise.all([
    getPosts({ page, category }),
    getCategories(),
  ]);

  return (
    <>
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: title,
            description,
            pathname: "/blog",
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: title, pathname: "/blog" },
            ]),
          }),
        )}
      />

      <BlogSection
        activeCategorySlug={category}
        categories={categories}
        description={description}
        posts={posts}
        title={title}
      />

      <Pager
        basePath="/blog"
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        page={page}
        params={{ category }}
      />
    </>
  );
}
