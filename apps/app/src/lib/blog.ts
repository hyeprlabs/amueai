import config from "@payload-config";
import { getPayload, type Where } from "payload";
import { cache } from "react";

import type { Author, Blog, Category, Tag } from "@/payload-types";

const POSTS_PER_PAGE = 12;

const publishedOnly = { _status: { equals: "published" } };

type PostListOptions = {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
};

/**
 * Loads a single blog post by slug.
 *
 * Cached per request so the page body and its `generateMetadata` share one
 * query. Pass `draft: true` from a route with Draft Mode enabled to read the
 * latest unpublished revision instead.
 */
export const getPostBySlug = cache(
  async (slug: string, { draft = false }: { draft?: boolean } = {}): Promise<Blog | undefined> => {
    const payload = await getPayload({ config });
    const { docs } = await payload.find({
      collection: "blog",
      where: draft
        ? { slug: { equals: slug } }
        : { and: [{ slug: { equals: slug } }, publishedOnly] },
      draft,
      limit: 1,
      depth: 2,
    });

    return docs[0];
  },
);

/** Paginated, published posts, newest first — optionally scoped to a category or tag. */
export async function getPosts({
  page = 1,
  limit = POSTS_PER_PAGE,
  category,
  tag,
  author,
}: PostListOptions = {}) {
  const payload = await getPayload({ config });

  const where: Where = { ...publishedOnly };
  if (category) where.categories = { in: [category] };
  if (tag) where.tags = { in: [tag] };
  if (author) where.author = { equals: author };

  const result = await payload.find({
    collection: "blog",
    where,
    sort: "-publishedAt",
    page,
    limit,
    depth: 1,
  });

  return result;
}

/** Every published post slug, ordered by slug — used to build the sitemap. */
export async function getPublishedPostSlugs(): Promise<Pick<Blog, "slug" | "updatedAt">[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "blog",
    where: publishedOnly,
    pagination: false,
    sort: "slug",
    depth: 0,
    select: { slug: true, updatedAt: true },
  });

  return docs as Pick<Blog, "slug" | "updatedAt">[];
}

/** Related posts: the post's manually curated list, falling back to posts sharing a category. */
export async function getRelatedPosts(post: Blog, limit = 3): Promise<Blog[]> {
  const payload = await getPayload({ config });

  const curated = (post.relatedPosts ?? []).filter(
    (related): related is Blog => typeof related === "object",
  );
  if (curated.length > 0) return curated.slice(0, limit);

  const categoryIds = (post.categories ?? [])
    .map((c) => (typeof c === "object" ? c.id : c))
    .filter(Boolean);
  if (categoryIds.length === 0) return [];

  const { docs } = await payload.find({
    collection: "blog",
    where: {
      and: [publishedOnly, { categories: { in: categoryIds } }, { id: { not_equals: post.id } }],
    },
    sort: "-publishedAt",
    limit,
    depth: 1,
  });

  return docs;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categories",
    pagination: false,
    sort: "title",
    depth: 0,
  });

  return docs;
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | undefined> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  return docs[0];
});

export const getTagBySlug = cache(async (slug: string): Promise<Tag | undefined> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tags",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  return docs[0];
});

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | undefined> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "authors",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  return docs[0];
});
