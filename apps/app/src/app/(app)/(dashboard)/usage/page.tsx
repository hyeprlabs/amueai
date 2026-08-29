import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { BotIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = createMetadata({
  title: "Usage",
  description: "Your workspace's agent activity at a glance.",
  pathname: "/usage",
  noIndex: true,
});

export default async function UsagePage() {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
        <div>
          <h1 className="text-lg font-medium">Select or create a workspace</h1>
          <p className="text-sm text-muted-foreground">
            AmueAI workspaces are Clerk organizations. Pick one from the switcher to see its usage.
          </p>
        </div>
        <OrganizationSwitcher hidePersonal />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();

  const [{ count: agentCount }, { data: agents }] = await Promise.all([
    supabase.from("agents").select("id", { count: "exact", head: true }),
    supabase
      .from("agents")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!agentCount) {
    return (
      <Empty className="min-h-96 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BotIcon />
          </EmptyMedia>
          <EmptyTitle>No agents yet</EmptyTitle>
          <EmptyDescription>
            Create your first agent to start training it on your data.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/new">Create an agent</Link>} />
        </EmptyContent>
      </Empty>
    );
  }

  const { count: sourceCount } = await supabase
    .from("sources")
    .select("id", { count: "exact", head: true });

  const { count: conversationCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Your workspace&apos;s agent activity at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Agents</CardDescription>
            <CardTitle className="text-2xl">{agentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Data sources</CardDescription>
            <CardTitle className="text-2xl">{sourceCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Conversations</CardDescription>
            <CardTitle className="text-2xl">{conversationCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent agents</CardTitle>
          <CardDescription>Jump back into an agent you&apos;ve set up.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {agents?.map((agent) => (
              <li key={agent.id}>
                <Link
                  href={`/agents/${agent.id}/overview`}
                  className="flex items-center justify-between py-2.5 text-sm hover:underline"
                >
                  <span className="font-medium">{agent.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
