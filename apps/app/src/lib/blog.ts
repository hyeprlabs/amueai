import config from "@payload-config";
import { getPayload, type Where } from "payload";
import { cache } from "react";

import type { Blog, Category, Tag } from "@/payload-types";

const POSTS_PER_PAGE = 12;

const publishedOnly = { _status: { equals: "published" } };

type PostListOptions = {
  page?: number;
  limit?: number;
  /** Category slug. */
  category?: string;
  /** Tag slugs — a post matching any one of them is included. */
  tags?: string[];
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

/** Paginated, published posts, newest first — optionally scoped to a category or tag slug. */
export async function getPosts({
  page = 1,
  limit = POSTS_PER_PAGE,
  category,
  tags,
}: PostListOptions = {}) {
  const payload = await getPayload({ config });

  const where: Where = { ...publishedOnly };
  if (category) where["categories.slug"] = { equals: category };
  if (tags && tags.length > 0) where["tags.slug"] = { in: tags };

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

export const getTags = cache(async (): Promise<Tag[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tags",
    pagination: false,
    sort: "title",
    depth: 0,
  });

  return docs;
});
