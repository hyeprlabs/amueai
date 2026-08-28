import { homeFaqItems } from "@/components/marketing/home-faq-items";
import { pricingFaqItems } from "@/components/marketing/pricing/pricing-faq-items";
import { plans } from "@/components/marketing/pricing/plans";
import { siteConfig, siteTitle } from "@/config/site";
import { richTextToPlainText } from "@/lib/api-v1-serializers";
import { getPostBySlug, getPosts } from "@/lib/blog";
import { getChanges } from "@/lib/changelog";
import { getCompetitorBySlug, getCompetitors } from "@/lib/competitors";
import { getLegalPage, getPublishedLegalPages } from "@/lib/legal-pages";
import { absoluteUrl } from "@/lib/seo";

/**
 * Markdown renditions of the pages that participate in Accept-header content
 * negotiation (acceptmarkdown.com). One function per route; `renderMarkdown`
 * dispatches on pathname. Returns `null` for anything not covered, so the
 * caller can fall back to a 404.
 *
 * Static pages render from the same constants their React components use
 * (`siteConfig`, the shared FAQ item lists, `plans`) so the markdown can't
 * say something the HTML doesn't. CMS-backed pages render from the same
 * Payload queries as their page components, with rich text flattened to
 * plain text via `richTextToPlainText`.
 */

function faqSection(items: { question: string; answer: string }[]): string {
  return items.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n");
}

function homeMarkdown(): string {
  return [
    `# ${siteTitle}`,
    "",
    siteConfig.description,
    "",
    "## Channels",
    "",
    "Deploy the same AI agent across every channel your customers already use: website (embed in one line of code), WhatsApp, and — coming soon — Instagram and iMessage.",
    "",
    "## FAQ",
    "",
    faqSection(homeFaqItems),
  ].join("\n");
}

function aboutMarkdown(): string {
  return [
    `# About ${siteConfig.name}`,
    "",
    `${siteConfig.name} turns the content you already have into an agent that answers your customers the moment they ask.`,
    "",
    "## Mission",
    "",
    `Most support questions have already been answered somewhere — in a help article, a policy page, a spec sheet. ${siteConfig.name} makes that knowledge answer for itself, around the clock, in your own words.`,
    "",
    "## Principles",
    "",
    "- Grounded, not guessing: answers come from your content, or the agent says it doesn't know.",
    "- Minutes, not quarters: from first source to live agent in an afternoon.",
    "- Built for the front line: designed for the people answering the same question all day.",
    "- Your data stays yours: your content trains your agent, never a shared model.",
  ].join("\n");
}

function pricingMarkdown(): string {
  const planLines = plans.map(
    (plan) =>
      `### ${plan.name} — $${plan.price.monthly}/mo ($${plan.price.yearly}/mo billed yearly)\n\n${plan.info}\n\n${plan.features.map((f) => `- ${f}`).join("\n")}`,
  );

  return [
    `# ${siteConfig.name} Pricing`,
    "",
    `Simple, transparent pricing for ${siteConfig.name}. Compare the Basic, Pro and Business plans and pick the one that scales with your team.`,
    "",
    ...planLines,
    "",
    "## FAQ",
    "",
    faqSection(pricingFaqItems),
  ].join("\n");
}

function contactMarkdown(): string {
  return [
    `# Contact ${siteConfig.name}`,
    "",
    `Reach the ${siteConfig.name} team at [${siteConfig.email}](mailto:${siteConfig.email}).`,
  ].join("\n");
}

function featuresAgentMarkdown(): string {
  return [
    "# AI Agent",
    "",
    `Build a custom AI agent trained on your own content that answers questions, captures leads, and supports customers 24/7 with ${siteConfig.name}.`,
    "",
    "## Capabilities",
    "",
    "- Trains on your content in under a minute",
    "- Embeds on your website in one line of code",
    "- Answers in 90+ languages",
    "- Answers 24/7",
    "- Won't invent answers outside its knowledge base",
    "- Your choice of underlying AI model",
    "- Matches your branding",
    "- Captures leads during conversations",
    "- Has a test playground before you go live",
    "- Deploys to every channel you support",
  ].join("\n");
}

function featuresChannelsMarkdown(): string {
  return [
    "# Channels",
    "",
    "Deploy the same AI agent across every channel your customers already use.",
    "",
    "- Web: add to any website in one line of code.",
    "- WhatsApp: chat with customers directly inside WhatsApp.",
    "- Instagram (coming soon): auto-reply to Instagram DMs and comments.",
    "- Messages (coming soon): bring your AI agent into iMessage conversations.",
  ].join("\n");
}

function developersMarkdown(): string {
  return [
    `# ${siteConfig.name} API for developers`,
    "",
    `Everything you need to integrate with ${siteConfig.name} programmatically — the public content API, its OpenAPI spec, and how agents should discover and call it.`,
    "",
    "## Authentication",
    "",
    "No API key is required. Every route is read-only (GET) and returns JSON.",
    "",
    "## Endpoints",
    "",
    "| Method | Path | Description |",
    "| --- | --- | --- |",
    "| GET | /api/v1/posts | List published blog posts. |",
    "| GET | /api/v1/posts/{slug} | Get a single blog post. |",
    "| GET | /api/v1/changelog | List published changelog entries. |",
    "| GET | /api/v1/competitors | List published comparison pages. |",
    "| GET | /api/v1/competitors/{slug} | Get a single comparison page. |",
    "| GET | /api/v1/legal-pages | List every published legal page. |",
    "| GET | /api/v1/legal-pages/{slug} | Get a single legal page. |",
    "",
    `- [OpenAPI specification](${absoluteUrl("/openapi.json")})`,
    `- [llms.txt](${absoluteUrl("/llms.txt")})`,
  ].join("\n");
}

async function safely<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error("[markdown] Payload could not be reached:", error);
    return fallback;
  }
}

async function blogIndexMarkdown(): Promise<string> {
  const result = await safely(() => getPosts({ limit: 20 }), null);
  const lines = [`# ${siteConfig.name} Blog`, "", "Product updates and guides.", ""];

  if (!result || result.docs.length === 0) {
    lines.push("_No posts available._");
  } else {
    for (const post of result.docs) {
      lines.push(`- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.excerpt}`);
    }
  }

  return lines.join("\n");
}

async function blogPostMarkdown(slug: string): Promise<string | null> {
  const post = await safely(() => getPostBySlug(slug), undefined);
  if (!post) return null;

  return [`# ${post.title}`, "", post.excerpt, "", richTextToPlainText(post.content)].join("\n");
}

async function changelogMarkdown(): Promise<string> {
  const result = await safely(() => getChanges({ limit: 30 }), null);
  const lines = [`# ${siteConfig.name} Changelog`, "", "Recent product changes.", ""];

  if (!result || result.docs.length === 0) {
    lines.push("_No changelog entries available._");
  } else {
    for (const change of result.docs) {
      lines.push(`## ${change.title}${change.version ? ` (${change.version})` : ""}`);
      lines.push("");
      lines.push(change.shortDescription);
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

async function competitorsIndexMarkdown(): Promise<string> {
  const result = await safely(() => getCompetitors({ limit: 50 }), null);
  const lines = [
    `# ${siteConfig.name} Comparisons`,
    "",
    `How ${siteConfig.name} compares to other AI agent platforms.`,
    "",
  ];

  if (!result || result.docs.length === 0) {
    lines.push("_No comparisons available._");
  } else {
    for (const competitor of result.docs) {
      lines.push(
        `- [${siteConfig.name} vs. ${competitor.name}](${absoluteUrl(`/vs/${competitor.slug}`)}): ${competitor.excerpt}`,
      );
    }
  }

  return lines.join("\n");
}

async function competitorMarkdown(slug: string): Promise<string | null> {
  const competitor = await safely(() => getCompetitorBySlug(slug), undefined);
  if (!competitor) return null;

  return [
    `# ${siteConfig.name} vs. ${competitor.name}`,
    "",
    competitor.verdict,
    "",
    competitor.excerpt,
    ...(competitor.bestFor ? ["", `**Best for:** ${competitor.bestFor}`] : []),
  ].join("\n");
}

async function legalIndexMarkdown(): Promise<string> {
  const pages = await safely(() => getPublishedLegalPages(), []);
  const lines = [`# ${siteConfig.name} Legal`, ""];

  if (pages.length === 0) {
    lines.push("_No legal pages available._");
  } else {
    for (const page of pages) {
      lines.push(`- [${page.title}](${absoluteUrl(`/legal/${page.slug}`)})`);
    }
  }

  return lines.join("\n");
}

async function legalPageMarkdown(slug: string): Promise<string | null> {
  const page = await safely(() => getLegalPage(slug), undefined);
  if (!page) return null;

  return [`# ${page.title}`, "", richTextToPlainText(page.content)].join("\n");
}

/** Renders the markdown rendition of `pathname`, or `null` if this route doesn't have one. */
export async function renderMarkdown(pathname: string): Promise<string | null> {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return homeMarkdown();

  switch (segments[0]) {
    case "about":
      return segments.length === 1 ? aboutMarkdown() : null;
    case "pricing":
      return segments.length === 1 ? pricingMarkdown() : null;
    case "contact":
      return segments.length === 1 ? contactMarkdown() : null;
    case "developers":
      return segments.length === 1 ? developersMarkdown() : null;
    case "features":
      if (segments[1] === "agent" && segments.length === 2) return featuresAgentMarkdown();
      if (segments[1] === "channels" && segments.length === 2) return featuresChannelsMarkdown();
      return null;
    case "blog":
      if (segments.length === 1) return blogIndexMarkdown();
      if (segments.length === 2) return blogPostMarkdown(segments[1]);
      return null;
    case "changelog":
      return segments.length === 1 ? changelogMarkdown() : null;
    case "competitors":
      return segments.length === 1 ? competitorsIndexMarkdown() : null;
    case "vs":
      return segments.length === 2 ? competitorMarkdown(segments[1]) : null;
    case "legal":
      if (segments.length === 1) return legalIndexMarkdown();
      if (segments.length === 2) return legalPageMarkdown(segments[1]);
      return null;
    default:
      return null;
  }
}
