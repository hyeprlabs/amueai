import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";

import { absoluteUrl } from "@/lib/seo";
import { resolveMedia } from "@/lib/media";
import type { Change, Competitor, LegalPage, Post } from "@/payload-types";

/** Renders a Lexical rich-text field down to plain text for the JSON API. */
export function richTextToPlainText(content: object): string {
  return convertLexicalToPlaintext({ data: content as never }).trim();
}

export type ApiPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string | null;
  categories: string[];
  image: string | null;
  publishedAt: string | null;
  updatedAt: string;
  url: string;
};

export function serializePost(post: Post): ApiPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: richTextToPlainText(post.content),
    author: typeof post.author === "object" ? post.author.name : null,
    categories: (post.categories ?? [])
      .filter((c): c is Exclude<typeof c, number> => typeof c === "object")
      .map((c) => c.title),
    image: resolveMedia(post.featuredImage)?.src ?? null,
    publishedAt: post.publishedAt ?? null,
    updatedAt: post.updatedAt,
    url: absoluteUrl(`/blog/${post.slug}`),
  };
}

export type ApiChange = {
  slug: string;
  title: string;
  shortDescription: string;
  type: Change["type"];
  version: string | null;
  content: string;
  publishedAt: string | null;
  updatedAt: string;
  url: string;
};

export function serializeChange(change: Change): ApiChange {
  return {
    slug: change.slug,
    title: change.title,
    shortDescription: change.shortDescription,
    type: change.type,
    version: change.version ?? null,
    content: richTextToPlainText(change.content),
    publishedAt: change.publishedAt ?? null,
    updatedAt: change.updatedAt,
    url: absoluteUrl(`/changelog#${change.slug}`),
  };
}

export type ApiCompetitor = {
  slug: string;
  name: string;
  excerpt: string;
  verdict: string;
  bestFor: string | null;
  website: string | null;
  updatedAt: string;
  url: string;
};

export function serializeCompetitor(competitor: Competitor): ApiCompetitor {
  return {
    slug: competitor.slug,
    name: competitor.name,
    excerpt: competitor.excerpt,
    verdict: competitor.verdict,
    bestFor: competitor.bestFor ?? null,
    website: competitor.website ?? null,
    updatedAt: competitor.updatedAt,
    url: absoluteUrl(`/vs/${competitor.slug}`),
  };
}

export type ApiLegalPage = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
  url: string;
};

export function serializeLegalPage(page: LegalPage): ApiLegalPage {
  return {
    slug: page.slug,
    title: page.title,
    content: richTextToPlainText(page.content),
    updatedAt: page.updatedAt,
    url: absoluteUrl(`/legal/${page.slug}`),
  };
}

export type ApiPageMeta = {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function paginationMeta(result: {
  page?: number | null;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}): ApiPageMeta {
  return {
    page: result.page ?? 1,
    limit: result.limit,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };
}
