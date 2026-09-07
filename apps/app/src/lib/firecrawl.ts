import "server-only";

import Firecrawl from "@mendable/firecrawl-js";

let firecrawlClient: Firecrawl | undefined;

export function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");
    firecrawlClient = new Firecrawl({ apiKey });
  }
  return firecrawlClient;
}
