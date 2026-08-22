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
  previewUrl?: string;
};

const DEFAULT_AUTHOR_SLUG = "ai-research-desk";
const DEFAULT_AUTHOR_NAME = "AI Research Desk";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/** Returns a human-readable validation error, or null if `body` is well-formed. */
export function validateAgentPostInput(body: Partial<CreateAgentPostInput>): string | null {
  if (!body.title?.trim()) return "title is required.";
  if (!body.excerpt?.trim()) return "excerpt is required.";
  if (body.excerpt.length > 300) return "excerpt must be 300 characters or fewer.";
  if (!body.contentMarkdown?.trim()) return "contentMarkdown is required.";
  if (!body.categories?.length) return "categories must include at least one category title.";
  if (!body.featuredImageUrl?.trim()) return "featuredImageUrl is required.";
  if (!body.featuredImageAlt?.trim()) return "featuredImageAlt is required.";
  return null;
}

async function findOrCreateCategory(payload: Payload, title: string) {
  const slug = slugify(title);
  const { docs } = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (docs[0]) return docs[0];

  return payload.create({ collection: "categories", data: { title, slug } });
}

async function findOrCreateTag(payload: Payload, title: string) {
  const slug = slugify(title);
  const { docs } = await payload.find({
    collection: "tags",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (docs[0]) return docs[0];

  return payload.create({ collection: "tags", data: { title, slug } });
}

async function resolveAuthor(payload: Payload, authorSlug?: string, authorName?: string) {
  const slug = authorSlug ? slugify(authorSlug) : DEFAULT_AUTHOR_SLUG;
  const { docs } = await payload.find({
    collection: "authors",
    where: { slug: { equals: slug } },
    limit: 1,
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
  });
}

async function uploadFeaturedImage(payload: Payload, imageUrl: string, alt: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch featuredImageUrl (${response.status}): ${imageUrl}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error(`featuredImageUrl did not return an image (got ${contentType})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("featuredImageUrl image exceeds the 12MB upload limit.");
  }

  const extension = contentType.split("/")[1]?.split("+")[0] || "jpg";
  const filename = `${slugify(alt).slice(0, 60) || "featured-image"}.${extension}`;

  return payload.create({
    collection: "media",
    data: { alt },
    file: {
      data: Buffer.from(arrayBuffer),
      mimetype: contentType,
      name: filename,
      size: arrayBuffer.byteLength,
    },
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

  const [categoryDocs, tagDocs, author, featuredImage] = await Promise.all([
    Promise.all(categories.map((name) => findOrCreateCategory(payload, name))),
    Promise.all((body.tags ?? []).map((name) => findOrCreateTag(payload, name))),
    resolveAuthor(payload, body.authorSlug, body.authorName),
    uploadFeaturedImage(payload, featuredImageUrl, featuredImageAlt),
  ]);

  const content = convertMarkdownToLexical({
    editorConfig: getBlogContentEditorConfig(payload),
    markdown: contentMarkdown,
  });

  const status = body.status === "published" ? "published" : "draft";

  const data = {
    title,
    slug: slugify(title),
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

  const post =
    status === "draft"
      ? await payload.create({ collection: "blog", draft: true, data })
      : await payload.create({
          collection: "blog",
          draft: false,
          data: { ...data, publishedAt: body.publishedAt || new Date().toISOString() },
        });

  return {
    id: post.id,
    slug: post.slug,
    status,
    url: absoluteUrl(`/blog/${post.slug}`),
    adminUrl: absoluteUrl(`/admin/collections/blog/${post.id}`),
    previewUrl:
      status === "draft"
        ? absoluteUrl(
            `/api/preview?secret=${process.env.PAYLOAD_PREVIEW_SECRET || ""}&slug=${post.slug}`,
          )
        : undefined,
  };
}
