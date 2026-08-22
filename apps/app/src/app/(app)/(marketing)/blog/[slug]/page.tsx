import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowLeftIcon } from "lucide-react";
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
} from "next-seo";

import { AuthorInfo } from "@/components/blog/author-info";
import { CategoryDropdown } from "@/components/blog/category-dropdown";
import { BlogFaq } from "@/components/blog/blog-faq";
import { PostGrid } from "@/components/blog/post-grid";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getCategories, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { resolveMedia } from "@/lib/media";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata, truncateForDescription } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Author, Category } from "@/payload-types";

async function loadPost(slug: string) {
  const { isEnabled: draft } = await draftMode();
  return { post: await getPostBySlug(slug, { draft }), draft };
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
  const image = resolveMedia(post.featuredImage, "og");
  const summary = truncateForDescription(post.meta?.description || post.excerpt);
  const pathname = `/blog/${post.slug}`;
  const [relatedPosts, allCategories] = await Promise.all([
    draft ? Promise.resolve([]) : getRelatedPosts(post),
    getCategories(),
  ]);
  const faqItems = post.faq?.enabled ? (post.faq.items ?? []) : [];

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({
          name: post.title,
          description: summary,
          pathname,
          datePublished: post.publishedAt ?? undefined,
          dateModified: post.updatedAt,
        })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: "Blog", pathname: "/blog" },
          { name: post.title, pathname },
        ])}
        scriptKey="breadcrumb"
      />
      <ArticleJsonLd
        type="BlogPosting"
        headline={post.title}
        description={summary}
        url={absoluteUrl(pathname)}
        author={{ "@type": "Person", name: author?.name ?? siteConfig.publisher }}
        datePublished={post.publishedAt ?? undefined}
        dateModified={post.updatedAt}
        image={image?.src ? absoluteUrl(image.src) : undefined}
        publisher={{ "@type": "Organization", name: siteConfig.name }}
        mainEntityOfPage={absoluteUrl(pathname)}
        scriptKey="article"
      />
      {faqItems.length > 0 && (
        <FAQJsonLd
          questions={faqItems.map((item) => ({ question: item.question, answer: item.answer }))}
          scriptKey="faq"
        />
      )}

      <article className="my-12 lg:my-24">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4">
          <Button className="w-fit" render={<Link href="/blog" />} size="sm" variant="outline">
            <ArrowLeftIcon aria-hidden data-icon="inline-start" />
            Back
          </Button>
          {allCategories.length > 0 && (
            <CategoryDropdown activeSlug={categories[0]?.slug} categories={allCategories} />
          )}
        </div>

        <div className="flex flex-col gap-4 border-t p-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
          {author && (
            <AuthorInfo
              author={author}
              publishedAt={post.publishedAt}
              readingTime={post.readingTime}
            />
          )}
        </div>

        <RichText
          className={cn(
            "richtext border-t p-4",
            faqItems.length === 0 && relatedPosts.length === 0 && "border-b",
          )}
          data={post.content}
        />
      </article>

      {faqItems.length > 0 && (
        <BlogFaq description={post.faq?.description} items={faqItems} title={post.faq?.title} />
      )}

      {relatedPosts.length > 0 && (
        <section className="mb-12 flex flex-col gap-6 border-t p-4 lg:mb-24">
          <h2 className="font-semibold text-xl tracking-tight">Related posts</h2>
          <PostGrid posts={relatedPosts} />
        </section>
      )}
    </>
  );
}
