import { getPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";
import { richTextToPlainText } from "@/lib/rich-text";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { docs: posts } = await getPosts({ limit: 50 });

  const items = posts
    .map((post) => {
      const author = typeof post.author === "object" ? post.author.name : undefined;
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : undefined;

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${absoluteUrl(`/blog/${post.slug}`)}</link>
      <guid>${absoluteUrl(`/blog/${post.slug}`)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${author ? `<author>${escapeXml(author)}</author>` : ""}
      <content:encoded><![CDATA[${richTextToPlainText(post.content)}]]></content:encoded>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteConfig.name)} Blog</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${siteConfig.language}</language>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${absoluteUrl("/blog/rss.xml")}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
