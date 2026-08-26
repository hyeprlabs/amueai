import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Pager } from "@/components/blog/pager";
import { PostGrid } from "@/components/blog/post-grid";
import { JsonLd } from "@/components/json-ld";
import { getPosts, getTagBySlug, parsePageParam } from "@/lib/blog";
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
}: PageProps<"/blog/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    return createMetadata({
      title: "Tag not found",
      description: "This blog tag does not exist.",
      pathname: `/blog/tag/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: `#${tag.title} — Blog`,
    description: `Posts tagged #${tag.title}.`,
    pathname: `/blog/tag/${tag.slug}`,
  });
}

export default async function BlogTagPage({ params, searchParams }: PageProps<"/blog/tag/[slug]">) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const { docs: posts, hasNextPage, hasPrevPage } = await getPosts({ page, tag: String(tag.id) });
  const pathname = `/blog/tag/${tag.slug}`;

  return (
    <>
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: `#${tag.title}`,
            description: `Posts tagged #${tag.title}.`,
            pathname,
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: "Blog", pathname: "/blog" },
              { name: `#${tag.title}`, pathname },
            ]),
          }),
        )}
      />

      <div className="my-12 flex flex-col gap-8 border-t p-4 lg:my-24">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">#{tag.title}</h1>
        <PostGrid posts={posts} />
      </div>

      <Pager basePath={pathname} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} page={page} />
    </>
  );
}
