import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, MinusIcon } from "lucide-react";
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
  JsonLdScript,
  OrganizationJsonLd,
} from "next-seo";

import { AuthorInfo } from "@/components/blog/author-info";
import { ComparisonTable } from "@/components/competition/comparison-table";
import { MarketingFaq } from "@/components/marketing-faq";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getCompetitorBySlug, getRelatedCompetitors } from "@/lib/competitors";
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
import type { Author, Competitor } from "@/payload-types";

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
    title: competitor.meta?.title || competitor.title,
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

  const author = typeof competitor.author === "object" ? (competitor.author as Author) : undefined;
  const image = resolveMedia(competitor.featuredImage, "og");
  const summary = truncateForDescription(competitor.meta?.description || competitor.excerpt);
  const pathname = `/vs/${competitor.slug}`;
  const rows = competitor.comparison ?? [];
  const strengths = competitor.strengths ?? [];
  const limitations = competitor.limitations ?? [];
  const faqItems = competitor.faq?.enabled ? (competitor.faq.items ?? []) : [];
  const related = draft ? [] : await getRelatedCompetitors(competitor);

  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({
          name: competitor.title,
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
          { name: "Competition", pathname: "/competition" },
          { name: `${siteConfig.name} vs ${competitor.name}`, pathname },
        ])}
        scriptKey="breadcrumb"
      />
      <ArticleJsonLd
        type="Article"
        headline={competitor.title}
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
      {faqItems.length > 0 && (
        <FAQJsonLd
          questions={faqItems.map((item) => ({ question: item.question, answer: item.answer }))}
          scriptKey="faq"
        />
      )}

      <article className="my-12 lg:my-24">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4">
          <Button
            className="w-fit"
            render={<Link href="/competition" />}
            size="sm"
            variant="outline"
          >
            <ArrowLeftIcon aria-hidden data-icon="inline-start" />
            All comparisons
          </Button>
          {competitor.website && (
            <Button
              className="text-muted-foreground"
              nativeButton={false}
              render={
                <a href={competitor.website} rel="nofollow noopener noreferrer" target="_blank">
                  {competitor.name} website <ArrowUpRightIcon aria-hidden />
                </a>
              }
              size="sm"
              variant="link"
            />
          )}
        </div>

        <div className="flex flex-col gap-4 border-t p-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{competitor.title}</h1>
          {author && (
            <AuthorInfo
              author={author}
              publishedAt={competitor.publishedAt}
              readingTime={competitor.readingTime}
            />
          )}
        </div>

        <ComparisonTable competitorName={competitor.name} rows={rows} />

        {/* The short answer: it is what a snippet quotes. */}
        <div className="border-t p-4">
          <h2 className="font-medium text-muted-foreground text-sm">The short answer</h2>
          <p className="mt-2 text-balance text-lg leading-relaxed">{competitor.verdict}</p>
        </div>

        {(strengths.length > 0 || limitations.length > 0) && (
          <section className="grid gap-x-8 gap-y-6 border-t p-4 sm:grid-cols-2">
            {strengths.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg tracking-tight">
                  Where {competitor.name} is strong
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {strengths.map((item, index) => (
                    <li className="flex gap-2" key={item.id ?? index}>
                      <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                      <span>{item.point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {limitations.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg tracking-tight">
                  Where {competitor.name} falls short
                </h2>
                <ul className="mt-3 space-y-2 text-muted-foreground text-sm">
                  {limitations.map((item, index) => (
                    <li className="flex gap-2" key={item.id ?? index}>
                      <MinusIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                      <span>{item.point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <RichText
          className={cn(
            "richtext border-t p-4",
            faqItems.length === 0 && related.length === 0 && "border-b",
          )}
          data={competitor.content}
        />
      </article>

      {faqItems.length > 0 && (
        <MarketingFaq
          description={competitor.faq?.description}
          items={faqItems}
          title={competitor.faq?.title}
        />
      )}

      {related.length > 0 && (
        <section className="mb-12 flex flex-col gap-3 border-t p-4 lg:mb-24">
          <h2 className="font-semibold text-xl tracking-tight">Other comparisons</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((other: Competitor) => (
              <li key={other.id}>
                <Button
                  nativeButton={false}
                  render={<Link href={`/vs/${other.slug}`} />}
                  size="sm"
                  variant="outline"
                >
                  {siteConfig.name} vs {other.name}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
