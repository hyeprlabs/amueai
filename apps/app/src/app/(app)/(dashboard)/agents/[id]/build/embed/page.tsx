import type { Metadata } from "next";

import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = createMetadata({
  title: "Embed",
  description: "Embed this agent on your site.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentEmbedPage({
  params,
}: PageProps<"/agents/[id]/build/embed">) {
  const { id } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed on your site</CardTitle>
        <CardDescription>
          Paste this before <code>&lt;/body&gt;</code> on any page — no login required for visitors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
          {`<script src="${siteConfig.url}/widget.js" data-agent-id="${id}" async></script>`}
        </pre>
      </CardContent>
    </Card>
  );
}
