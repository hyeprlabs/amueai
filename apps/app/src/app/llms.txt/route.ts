import { siteConfig, siteTitle } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

/**
 * `llms.txt` (https://llmstxt.org) — a plain-text index AI agents and LLM
 * crawlers can read directly instead of parsing rendered HTML. Lists the
 * pages worth citing, in the format the spec expects: an H1, a blockquote
 * summary, then link lists grouped under H2 sections.
 *
 * Kept to the stable marketing routes rather than enumerating every CMS
 * entry, so it stays accurate without a database round-trip on every request.
 */
function buildLlmsTxt(): string {
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `${siteTitle}. Train a custom AI agent on your own content in minutes, then deploy it on your website, WhatsApp, and more to answer questions, capture leads, and support customers 24/7 in 90+ languages.`,
    "",
    "## Product",
    "",
    `- [Home](${absoluteUrl("/")}): Overview of ${siteConfig.name} and how agent training works.`,
    `- [AI Agent](${absoluteUrl("/features/agent")}): How the agent is trained, what it can do, and how it avoids answering outside its knowledge base.`,
    `- [Channels](${absoluteUrl("/features/channels")}): Where an agent can be deployed — website embed, WhatsApp, and more.`,
    `- [Pricing](${absoluteUrl("/pricing")}): Plans, limits, and billing.`,
    `- [Compare](${absoluteUrl("/competitors")}): How ${siteConfig.name} compares to other AI agent platforms.`,
    "",
    "## Company",
    "",
    `- [About](${absoluteUrl("/about")}): Who builds ${siteConfig.name}.`,
    `- [Blog](${absoluteUrl("/blog")}): Product updates and guides.`,
    `- [Changelog](${absoluteUrl("/changelog")}): Recent product changes.`,
    `- [Contact](${absoluteUrl("/contact")}): How to reach the team.`,
    "",
    "## Optional",
    "",
    `- [Sitemap](${absoluteUrl("/sitemap.xml")}): Full, machine-readable list of every page.`,
  ];

  return `${lines.join("\n")}\n`;
}

/** Rebuilt periodically so a change to a marketing route doesn't need a redeploy. */
export const revalidate = 3600;

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
