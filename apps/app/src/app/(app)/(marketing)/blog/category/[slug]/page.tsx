import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Pager } from "@/components/blog/pager";
import { PostGrid } from "@/components/blog/post-grid";
import { JsonLd } from "@/components/json-ld";
import { getCategoryBySlug, getPosts } from "@/lib/blog";
import { createMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  organizationSchema,
  structuredDataGraph,
  webPageSchema,
  websiteSchema,
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return createMetadata({
      title: "Category not found",
      description: "This blog category does not exist.",
      pathname: `/blog/category/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `${category.title} — Blog`,
    description: category.description || `Posts filed under ${category.title}.`,
    pathname: `/blog/category/${category.slug}`,
  });
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: PageProps<"/blog/category/[slug]">) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const {
    docs: posts,
    hasNextPage,
    hasPrevPage,
  } = await getPosts({
    page,
    category: String(category.id),
  });
  const pathname = `/blog/category/${category.slug}`;

  return (
    <>
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: category.title,
            description: category.description || `Posts filed under ${category.title}.`,
            pathname,
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: "Blog", pathname: "/blog" },
              { name: category.title, pathname },
            ]),
          }),
        )}
      />

      <div className="my-12 flex flex-col gap-8 border-t p-4 lg:my-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{category.title}</h1>
          {category.description && <p className="text-muted-foreground">{category.description}</p>}
        </div>

        <PostGrid posts={posts} />
      </div>

      <Pager basePath={pathname} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} page={page} />
    </>
  );
}
