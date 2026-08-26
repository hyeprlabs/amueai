import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
} from "next-seo";

import { AuthorInfo } from "@/components/blog/author-info";
import { ComparisonTable } from "@/components/competitors/comparison-table";
import { MarketingFaq } from "@/components/marketing-faq";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { competitorPageTitle, getCompetitorBySlug, getRelatedCompetitors } from "@/lib/competitors";
import { resolveMedia } from "@/lib/media";
import {
  breadcrumbItems,
  comparisonJsonLd,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata, truncateForDescription } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { Author } from "@/payload-types";

async function loadCompetitor(slug: string) {
  const { isEnabled: draft } = await draftMode();
  return { competitor: await getCompetitorBySlug(slug, { draft }), draft };
}

export async function generateMetadata({ params }: PageProps<"/vs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { competitor } = await loadCompetitor(slug);

  if (!competitor) {
    return createMetadata({
      title: "Comparison not found",
      description: "The comparison you are looking for does not exist or has been moved.",
      pathname: `/vs/${slug}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: competitor.meta?.title || competitorPageTitle(competitor.name),
    description: competitor.meta?.description || truncateForDescription(competitor.excerpt),
    pathname: `/vs/${competitor.slug}`,
    article: {
      publishedTime: competitor.publishedAt ?? undefined,
      modifiedTime: competitor.updatedAt,
    },
  });
}

export default async function CompetitorPage({ params }: PageProps<"/vs/[slug]">) {
  const { slug } = await params;
  const { competitor, draft } = await loadCompetitor(slug);

  if (!competitor) notFound();

  const title = competitorPageTitle(competitor.name);
  const author = typeof competitor.author === "object" ? (competitor.author as Author) : undefined;
  const image = resolveMedia(competitor.featuredImage, "og");
  const summary = truncateForDescription(competitor.meta?.description || competitor.excerpt);
  const pathname = `/vs/${competitor.slug}`;
  const rows = competitor.comparison ?? [];
  const faqItems = competitor.faq?.enabled ? (competitor.faq.items ?? []) : [];
  const related = draft ? [] : await getRelatedCompetitors(competitor);
  const hasFaq = faqItems.length > 0;
  const hasRelated = related.length > 0;

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({
          name: title,
          description: summary,
          pathname,
          datePublished: competitor.publishedAt ?? undefined,
          dateModified: competitor.updatedAt,
        })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: "Competitors", pathname: "/competitors" },
          { name: title, pathname },
        ])}
        scriptKey="breadcrumb"
      />
      <ArticleJsonLd
        type="Article"
        headline={title}
        description={summary}
        url={absoluteUrl(pathname)}
        author={{ "@type": "Person", name: author?.name ?? siteConfig.publisher }}
        datePublished={competitor.publishedAt ?? undefined}
        dateModified={competitor.updatedAt}
        image={image?.src ? absoluteUrl(image.src) : undefined}
        publisher={{ "@type": "Organization", name: siteConfig.name }}
        mainEntityOfPage={absoluteUrl(pathname)}
        scriptKey="article"
      />
      <JsonLdScript
        data={comparisonJsonLd({
          competitorName: competitor.name,
          competitorUrl: competitor.website ?? undefined,
        })}
        scriptKey="comparison"
      />
      {hasFaq && (
        <FAQJsonLd
          questions={faqItems.map((item) => ({ question: item.question, answer: item.answer }))}
          scriptKey="faq"
        />
      )}

      <article className="my-12 lg:my-24">
        <div className="border-t p-4">
          <Button
            className="w-fit"
            render={<Link href="/competitors" />}
            size="sm"
            variant="outline"
          >
            <ArrowLeftIcon aria-hidden data-icon="inline-start" />
            All Competitors
          </Button>
        </div>

        <div className="flex flex-col gap-4 border-t p-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          {author && (
            <AuthorInfo
              author={author}
              publishedAt={competitor.publishedAt}
              readingTime={competitor.readingTime}
            />
          )}
        </div>

        {/* The short answer, above the table: it is what a snippet quotes. */}
        <div className="border-t p-4">
          <h2 className="font-medium text-muted-foreground text-sm">The short answer</h2>
          <p className="mt-2 text-balance text-lg leading-relaxed">{competitor.verdict}</p>
        </div>

        <ComparisonTable competitorName={competitor.name} rows={rows} />

        <RichText
          className={cn("richtext border-t p-4", !hasFaq && !hasRelated && "border-b")}
          data={competitor.content}
        />
      </article>

      {hasFaq && (
        <MarketingFaq
          description={competitor.faq?.description}
          items={faqItems}
          title={competitor.faq?.title}
        />
      )}

      {hasRelated && (
        <section className="mb-12 border-y p-4 lg:mb-24">
          <h2 className="mb-3 font-semibold text-xl tracking-tight">Other comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((other) => (
              <Button key={other.id} render={<Link href={`/vs/${other.slug}`} />} variant="outline">
                {other.name} vs. {siteConfig.name}
                <ArrowUpRightIcon aria-hidden data-icon="inline-end" />
              </Button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
