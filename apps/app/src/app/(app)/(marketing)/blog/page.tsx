import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";

import { BlogFilters } from "@/components/blog/blog-filters";
import { PostGrid } from "@/components/blog/post-grid";
import { Pager } from "@/components/blog/pager";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/config/site";
import { getCategories, getPosts, getTags } from "@/lib/blog";
import { loadBlogSearchParams } from "@/lib/blog-search-params";
import { createMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  organizationSchema,
  structuredDataGraph,
  webPageSchema,
  websiteSchema,
} from "@/lib/structured-data";

const title = "Blog";
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
  searchParams: Promise<SearchParams>;
}) {
  const { page, category, tag } = await loadBlogSearchParams(searchParams);

  const [{ docs: posts, hasNextPage, hasPrevPage }, categories, tags] = await Promise.all([
    getPosts({ page, category: category ?? undefined, tag: tag ?? undefined }),
    getCategories(),
    getTags(),
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

      <div className="my-12 flex flex-col gap-8 border-t p-4 lg:my-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <BlogFilters categories={categories} tags={tags} />

        <PostGrid posts={posts} />
      </div>

      <Pager
        basePath="/blog"
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        page={page}
        params={{ category: category ?? undefined, tag: tag ?? undefined }}
      />
    </>
  );
}
