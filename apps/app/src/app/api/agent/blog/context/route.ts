import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { verifyAgentToken } from "@/lib/agent-auth";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

/**
 * Read-only briefing for an external writing agent: what the site is about,
 * what taxonomy already exists (so new posts reuse it instead of drifting),
 * and recent post titles (so the agent doesn't repeat a topic).
 */
export async function GET(request: Request) {
  const unauthorized = verifyAgentToken(request);
  if (unauthorized) return unauthorized;

  const payload = await getPayload({ config });

  const [categories, tags, authors, recentPosts] = await Promise.all([
    payload.find({ collection: "categories", pagination: false, sort: "title", depth: 0 }),
    payload.find({ collection: "tags", pagination: false, sort: "title", depth: 0 }),
    payload.find({ collection: "authors", pagination: false, sort: "name", depth: 0 }),
    payload.find({
      collection: "blog",
      pagination: false,
      limit: 50,
      sort: "-createdAt",
      depth: 0,
      select: { title: true, slug: true, _status: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    site: {
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
      url: siteConfig.url,
      audience: "Founders and teams evaluating or using AI customer-facing agents.",
    },
    writingGuidelines: {
      tone: "Direct, concrete, no hype. Prefer specifics and examples over generic claims.",
      length: "800-1500 words.",
      format:
        "Markdown with # for the title (not repeated in the body), ## for sections, short paragraphs, and code blocks only when genuinely relevant.",
      excerpt:
        "One or two sentences, <= 300 characters, usable as both a teaser and meta description.",
      avoid: "Don't repeat a topic already covered — check recentPosts below first.",
    },
    taxonomy: {
      categories: categories.docs.map((c) => ({ title: c.title, slug: c.slug })),
      tags: tags.docs.map((t) => ({ title: t.title, slug: t.slug })),
      authors: authors.docs.map((a) => ({ name: a.name, slug: a.slug })),
    },
    recentPosts: recentPosts.docs.map((p) => ({
      title: p.title,
      slug: p.slug,
      status: p._status,
      createdAt: p.createdAt,
    })),
    submit: {
      method: "POST",
      url: "/api/agent/blog/posts",
      auth: "Authorization: Bearer <BLOG_AGENT_TOKEN>",
    },
  });
}
