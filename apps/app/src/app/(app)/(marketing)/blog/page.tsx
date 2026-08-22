import type { Metadata } from "next";
import Link from "next/link";

import { PostGrid } from "@/components/blog/post-grid";
import { Pager } from "@/components/blog/pager";
import { Badge } from "@/components/ui/badge";
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

export default async function BlogIndexPage({ searchParams }: PageProps<"/blog">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ docs: posts, hasNextPage, hasPrevPage }, categories] = await Promise.all([
    getPosts({ page }),
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

      <div className="my-12 flex flex-col gap-8 border-t p-4 lg:my-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                render={<Link href={`/blog/category/${category.slug}`} />}
                variant="outline"
              >
                {category.title}
              </Badge>
            ))}
          </div>
        )}

        <PostGrid posts={posts} />
      </div>

      <Pager basePath="/blog" hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} page={page} />
    </>
  );
}
