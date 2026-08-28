import type { Metadata } from "next";

import { createMetadata } from "@/lib/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestChat } from "./test-chat";

export const metadata: Metadata = createMetadata({
  title: "Playground",
  description: "Test this agent before embedding it.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentPlaygroundPage({
  params,
}: PageProps<"/agents/[id]/playground">) {
  const { id } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playground</CardTitle>
        <CardDescription>Calls the same API the public widget uses.</CardDescription>
      </CardHeader>
      <CardContent>
        <TestChat agentId={id} />
      </CardContent>
    </Card>
  );
}
