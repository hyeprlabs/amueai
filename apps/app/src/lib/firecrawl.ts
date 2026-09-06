import "server-only";

import Firecrawl from "@mendable/firecrawl-js";

let firecrawlClient: Firecrawl | undefined;

/**
 * Firecrawl owns fetching and parsing for every source type: `.scrape()`/
 * `.crawl()` for URLs (SSRF protection, JS rendering, anti-bot handling,
 * and full-site discovery all on their infrastructure), `.parse()` for
 * uploaded files. No hand-rolled fetch/cheerio crawler or PDF/Office
 * parsing library anywhere in this app.
 */
export function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
    firecrawlClient = new Firecrawl({ apiKey });
  }
  return firecrawlClient;
}
