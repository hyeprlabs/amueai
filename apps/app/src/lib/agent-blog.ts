import { convertMarkdownToLexical } from "@payloadcms/richtext-lexical";
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical";
import type { Payload } from "payload";
import slugify from "slug";

import { absoluteUrl } from "@/lib/seo";

export type CreateAgentPostInput = {
  title: string;
  excerpt: string;
  contentMarkdown: string;
  categories: string[];
  tags?: string[];
  authorSlug?: string;
  authorName?: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: "draft" | "published";
  publishedAt?: string;
};

export type CreateAgentPostResult = {
  id: number | string;
  slug: string;
  status: "draft" | "published";
  url: string;
  adminUrl: string;
};

const DEFAULT_AUTHOR_SLUG = "ai-research-desk";
const DEFAULT_AUTHOR_NAME = "AI Research Desk";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Returns a human-readable validation error, or null if `body` is well-formed. */
export function validateAgentPostInput(body: Partial<CreateAgentPostInput>): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";

  if (!isNonEmptyString(body.title)) return "title is required.";
  if (!isNonEmptyString(body.excerpt)) return "excerpt is required.";
  if (body.excerpt.length > 300) return "excerpt must be 300 characters or fewer.";
  if (!isNonEmptyString(body.contentMarkdown)) return "contentMarkdown is required.";
  if (
    !Array.isArray(body.categories) ||
    body.categories.length === 0 ||
    !body.categories.every(isNonEmptyString)
  ) {
    return "categories must include at least one category title.";
  }
  if (!isNonEmptyString(body.featuredImageUrl)) return "featuredImageUrl is required.";
  if (!isNonEmptyString(body.featuredImageAlt)) return "featuredImageAlt is required.";
  return null;
}

async function findOrCreateCategory(
  payload: Payload,
  title: string,
  transactionID?: string | number,
) {
  const req = transactionID ? { transactionID } : undefined;
  const slug = slugify(title);
  const { docs } = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
    req,
  });
  if (docs[0]) return docs[0];

  return payload.create({
    collection: "categories",
    data: { title, slug },
    req,
  });
}

async function findOrCreateTag(payload: Payload, title: string, transactionID?: string | number) {
  const req = transactionID ? { transactionID } : undefined;
  const slug = slugify(title);
  const { docs } = await payload.find({
    collection: "tags",
    where: { slug: { equals: slug } },
    limit: 1,
    req,
  });
  if (docs[0]) return docs[0];

  return payload.create({ collection: "tags", data: { title, slug }, req });
}

async function resolveAuthor(
  payload: Payload,
  authorSlug?: string,
  authorName?: string,
  transactionID?: string | number,
) {
  const req = transactionID ? { transactionID } : undefined;
  const slug = authorSlug ? slugify(authorSlug) : DEFAULT_AUTHOR_SLUG;
  const { docs } = await payload.find({
    collection: "authors",
    where: { slug: { equals: slug } },
    limit: 1,
    req,
  });
  if (docs[0]) return docs[0];

  return payload.create({
    collection: "authors",
    data: {
      name: authorName || (authorSlug ? authorSlug : DEFAULT_AUTHOR_NAME),
      slug,
      bio:
        slug === DEFAULT_AUTHOR_SLUG
          ? "Automated research and writing, reviewed before publishing."
          : undefined,
    },
    req,
  });
}

const IMAGE_FETCH_TIMEOUT_MS = 15_000;

/** Blocks fetches to loopback/private/link-local hosts, a basic SSRF guard for agent-supplied URLs. */
function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "[::1]" || host === "::1") {
    return true;
  }

  // IPv4 literal checks: loopback, private ranges, link-local, and the
  // 0.0.0.0/cloud-metadata range some SSRF payloads target.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  return false;
}

function assertSafeImageUrl(url: URL) {
  if (url.protocol !== "https:") {
    throw new Error("featuredImageUrl must be an https:// URL.");
  }
  if (isPrivateOrLoopbackHost(url.hostname)) {
    throw new Error("featuredImageUrl may not point to a private or loopback host.");
  }
}

type FetchedImage = {
  data: Buffer;
  contentType: string;
  size: number;
};

/**
 * Downloads and validates the featured image without touching the database,
 * so a bad URL fails before any Payload records exist for this post.
 */
async function fetchFeaturedImage(imageUrl: string): Promise<FetchedImage> {
  const url = new URL(imageUrl);
  assertSafeImageUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Could not fetch featuredImageUrl (${response.status}): ${imageUrl}`);
  }

  // `redirect: "follow"` may have taken us to a different host — re-validate
  // the URL we actually landed on before trusting its response.
  assertSafeImageUrl(new URL(response.url));

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error(`featuredImageUrl did not return an image (got ${contentType})`);
  }

  if (!response.body) {
    throw new Error("featuredImageUrl response had no body.");
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        throw new Error("featuredImageUrl image exceeds the 12MB upload limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return { data: Buffer.concat(chunks, total), contentType, size: total };
}

async function createFeaturedImageMedia(
  payload: Payload,
  image: FetchedImage,
  alt: string,
  transactionID?: string | number,
) {
  const extension = image.contentType.split("/")[1]?.split("+")[0] || "jpg";
  const filename = `${slugify(alt).slice(0, 60) || "featured-image"}.${extension}`;

  return payload.create({
    collection: "media",
    data: { alt },
    file: {
      data: image.data,
      mimetype: image.contentType,
      name: filename,
      size: image.size,
    },
    req: transactionID ? { transactionID } : undefined,
  });
}

/**
 * Payload resolves each richText field's `editor` factory once at config
 * sanitization time and stores the result (including `editorConfig`) back
 * onto the field — reusing it here keeps the markdown conversion in sync
 * with whatever lexical features Blog's `content` field actually declares,
 * instead of re-deriving a separate editor config by hand.
 */
function getBlogContentEditorConfig(payload: Payload): SanitizedServerEditorConfig {
  const contentField = payload.collections.blog.config.fields.find(
    (field) => "name" in field && field.name === "content",
  );

  if (
    !contentField ||
    contentField.type !== "richText" ||
    !contentField.editor ||
    !("editorConfig" in contentField.editor)
  ) {
    throw new Error("Could not resolve the Blog collection's richText editor config.");
  }

  return contentField.editor.editorConfig as SanitizedServerEditorConfig;
}

/**
 * Given a finished article (markdown + metadata), creates categories/tags/
 * author as needed, uploads the featured image, converts the markdown to
 * Lexical, and creates the Blog post.
 *
 * Defaults to `status: "draft"` so AI-authored posts are reviewed in the
 * admin before going live — pass `status: "published"` explicitly to skip
 * review.
 */
export async function createAgentBlogPost(
  payload: Payload,
  body: CreateAgentPostInput,
): Promise<CreateAgentPostResult> {
  const { title, excerpt, contentMarkdown, categories, featuredImageUrl, featuredImageAlt } = body;
  const slug = slugify(title);

  // A retried request (same title) resolves to the same slug — return the
  // existing post instead of creating a duplicate.
  const { docs: existing } = await payload.find({
    collection: "blog",
    where: { slug: { equals: slug } },
    limit: 1,
    draft: true,
  });
  if (existing[0]) {
    const existingPost = existing[0];
    return {
      id: existingPost.id,
      slug: existingPost.slug,
      status: existingPost._status === "published" ? "published" : "draft",
      url: absoluteUrl(`/blog/${existingPost.slug}`),
      adminUrl: absoluteUrl(`/admin/collections/blog/${existingPost.id}`),
    };
  }

  // Download and validate the image before touching the database — a bad
  // URL should fail without leaving orphaned category/tag/author rows.
  const fetchedImage = await fetchFeaturedImage(featuredImageUrl);

  const content = convertMarkdownToLexical({
    editorConfig: getBlogContentEditorConfig(payload),
    markdown: contentMarkdown,
  });

  const status = body.status === "published" ? "published" : "draft";

  // All remaining writes (categories, tags, author, media, the post itself)
  // share one DB transaction: if anything fails, the adapter rolls every row
  // back. The one exception is the Vercel Blob object the media upload
  // creates in external storage — that isn't part of the DB transaction, so
  // a rollback here can leave an orphaned blob for the media collection's
  // cleanup job to catch.
  const transactionID = (await payload.db.beginTransaction?.()) ?? undefined;

  try {
    const [categoryDocs, tagDocs, author, featuredImage] = await Promise.all([
      Promise.all(categories.map((name) => findOrCreateCategory(payload, name, transactionID))),
      Promise.all((body.tags ?? []).map((name) => findOrCreateTag(payload, name, transactionID))),
      resolveAuthor(payload, body.authorSlug, body.authorName, transactionID),
      createFeaturedImageMedia(payload, fetchedImage, featuredImageAlt, transactionID),
    ]);

    const data = {
      title,
      slug,
      excerpt,
      content,
      featuredImage: featuredImage.id,
      author: author.id,
      categories: categoryDocs.map((c) => c.id),
      tags: tagDocs.map((t) => t.id),
      meta: {
        title: body.metaTitle,
        description: body.metaDescription,
      },
    };

    const req = transactionID ? { transactionID } : undefined;
    const post =
      status === "draft"
        ? await payload.create({ collection: "blog", draft: true, data, req })
        : await payload.create({
            collection: "blog",
            draft: false,
            data: {
              ...data,
              publishedAt: body.publishedAt || new Date().toISOString(),
            },
            req,
          });

    if (transactionID) await payload.db.commitTransaction?.(transactionID);

    return {
      id: post.id,
      slug: post.slug,
      status,
      url: absoluteUrl(`/blog/${post.slug}`),
      adminUrl: absoluteUrl(`/admin/collections/blog/${post.id}`),
    };
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction?.(transactionID);
    throw error;
  }
}
