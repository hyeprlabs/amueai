import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Pager } from "@/components/blog/pager";
import { PostGrid } from "@/components/blog/post-grid";
import { JsonLd } from "@/components/json-ld";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthorBySlug, getPosts } from "@/lib/blog";
import { resolveMedia } from "@/lib/media";
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
}: PageProps<"/blog/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    return createMetadata({
      title: "Author not found",
      description: "This author does not exist.",
      pathname: `/blog/author/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: author.name,
    description: author.bio || `Posts written by ${author.name}.`,
    pathname: `/blog/author/${author.slug}`,
  });
}

export default async function BlogAuthorPage({
  params,
  searchParams,
}: PageProps<"/blog/author/[slug]">) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const {
    docs: posts,
    hasNextPage,
    hasPrevPage,
  } = await getPosts({
    page,
    author: String(author.id),
  });
  const pathname = `/blog/author/${author.slug}`;
  const avatar = resolveMedia(author.avatar, "thumbnail");

  return (
    <>
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: author.name,
            description: author.bio || `Posts written by ${author.name}.`,
            pathname,
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: "Blog", pathname: "/blog" },
              { name: author.name, pathname },
            ]),
          }),
        )}
      />

      <div className="my-12 flex flex-col gap-8 border-t p-4 lg:my-24">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {avatar && <AvatarImage alt={avatar.alt} src={avatar.src} />}
            <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{author.name}</h1>
            {author.title && <p className="text-muted-foreground text-sm">{author.title}</p>}
          </div>
        </div>
        {author.bio && <p className="text-muted-foreground">{author.bio}</p>}

        <PostGrid posts={posts} />
      </div>

      <Pager basePath={pathname} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} page={page} />
    </>
  );
}
