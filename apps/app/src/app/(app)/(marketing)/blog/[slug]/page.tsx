import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";

import { AuthorByline } from "@/components/blog/author-byline";
import { PostGrid } from "@/components/blog/post-grid";
import { JsonLd } from "@/components/json-ld";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { resolveMedia } from "@/lib/media";
import { createMetadata, truncateForDescription } from "@/lib/seo";
import {
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
  structuredDataGraph,
  webPageSchema,
  websiteSchema,
} from "@/lib/structured-data";
import type { Author, Category, Tag } from "@/payload-types";

async function loadPost(slug: string) {
  const { isEnabled: draft } = await draftMode();
  return { post: await getPostBySlug(slug, draft), draft };
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await loadPost(slug);

  if (!post) {
    return createMetadata({
      title: "Post not found",
      description: "The blog post you are looking for does not exist or has been moved.",
      pathname: `/blog/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: post.meta?.title || post.title,
    description: post.meta?.description || truncateForDescription(post.excerpt),
    pathname: `/blog/${post.slug}`,
    article: {
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
    },
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const { post, draft } = await loadPost(slug);

  if (!post) notFound();

  const author = typeof post.author === "object" ? (post.author as Author) : undefined;
  const categories = (post.categories ?? []).filter(
    (category): category is Category => typeof category === "object",
  );
  const tags = (post.tags ?? []).filter((tag): tag is Tag => typeof tag === "object");
  const image = resolveMedia(post.featuredImage, "og");
  const summary = truncateForDescription(post.meta?.description || post.excerpt);
  const pathname = `/blog/${post.slug}`;
  const relatedPosts = draft ? [] : await getRelatedPosts(post);

  return (
    <>
      <JsonLd
        data={structuredDataGraph(
          organizationSchema(),
          websiteSchema(),
          webPageSchema({
            name: post.title,
            description: summary,
            pathname,
            datePublished: post.publishedAt ?? undefined,
            dateModified: post.updatedAt,
            breadcrumb: breadcrumbSchema([
              { name: "Home", pathname: "/" },
              { name: "Blog", pathname: "/blog" },
              { name: post.title, pathname },
            ]),
          }),
          articleSchema({
            title: post.title,
            description: summary,
            pathname,
            image: image?.src,
            datePublished: post.publishedAt ?? undefined,
            dateModified: post.updatedAt,
            authorName: author?.name ?? siteConfig.publisher,
            authorPathname: author ? `/blog/author/${author.slug}` : undefined,
          }),
        )}
      />

      <article className="my-12 lg:my-24">
        <header className="flex flex-col gap-6 border-t p-4">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  render={<Link href={`/blog/category/${category.slug}`} />}
                  variant="secondary"
                >
                  {category.title}
                </Badge>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
          {author && (
            <AuthorByline
              author={author}
              publishedAt={post.publishedAt}
              readingTime={post.readingTime}
            />
          )}
        </header>

        {image && (
          <div className="relative aspect-video w-full overflow-hidden border-y bg-muted">
            <Image
              alt={image.alt}
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src={image.src}
            />
          </div>
        )}

        <RichText className="border-b p-4" data={post.content} />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b p-4">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                render={<Link href={`/blog/tag/${tag.slug}`} />}
                variant="outline"
              >
                #{tag.title}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {relatedPosts.length > 0 && (
        <section className="mb-12 flex flex-col gap-6 border-t p-4 lg:mb-24">
          <h2 className="text-xl font-semibold tracking-tight">Related posts</h2>
          <PostGrid posts={relatedPosts} />
        </section>
      )}
    </>
  );
}
