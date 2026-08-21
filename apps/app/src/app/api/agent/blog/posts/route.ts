import config from "@payload-config";
import { convertMarkdownToLexical } from "@payloadcms/richtext-lexical";
import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical";
import { NextResponse } from "next/server";
import { getPayload, type Payload } from "payload";
import slugify from "slug";

import { verifyAgentToken } from "@/lib/agent-auth";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CreatePostBody = {
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

const DEFAULT_AUTHOR_SLUG = "ai-research-desk";
const DEFAULT_AUTHOR_NAME = "AI Research Desk";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
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
 * Ingestion endpoint for an external writing agent: given a finished article
 * (markdown + metadata), creates categories/tags/author as needed, uploads the
 * featured image, converts the markdown to Lexical, and creates the Blog post.
 *
 * Defaults to `status: "draft"` so AI-authored posts are reviewed in the admin
 * before going live — pass `status: "published"` explicitly to skip review.
 */
export async function POST(request: Request) {
  const unauthorized = verifyAgentToken(request);
  if (unauthorized) return unauthorized;

  let body: CreatePostBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const { title, excerpt, contentMarkdown, categories, featuredImageUrl, featuredImageAlt } = body;

  if (!title?.trim()) return badRequest("title is required.");
  if (!excerpt?.trim()) return badRequest("excerpt is required.");
  if (excerpt.length > 300) return badRequest("excerpt must be 300 characters or fewer.");
  if (!contentMarkdown?.trim()) return badRequest("contentMarkdown is required.");
  if (!categories?.length)
    return badRequest("categories must include at least one category title.");
  if (!featuredImageUrl?.trim()) return badRequest("featuredImageUrl is required.");
  if (!featuredImageAlt?.trim()) return badRequest("featuredImageAlt is required.");

  const payload = await getPayload({ config });

  try {
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("[agent/blog/posts] Failed to create post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post." },
      { status: 500 },
    );
  }
}
