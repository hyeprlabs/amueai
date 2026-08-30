import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BotIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";
import { NoWorkspace } from "@/components/dashboard/no-workspace";

export const metadata: Metadata = createMetadata({
  title: "Usage",
  description: "Your workspace's agent activity at a glance.",
  pathname: "/usage",
  noIndex: true,
});

export default async function UsagePage() {
  const { orgId } = await auth();

  if (!orgId) return <NoWorkspace />;

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
      <DashboardEmpty
        description="Create your first agent to start training it on your data."
        icon={<BotIcon />}
        title="No agents yet"
      >
        <Button nativeButton={false} render={<Link href="/new">Create an agent</Link>} />
      </DashboardEmpty>
    );
  }

  const [{ count: sourceCount }, { count: conversationCount }] = await Promise.all([
    supabase.from("sources").select("id", { count: "exact", head: true }),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
  ]);

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
          <Table>
            <TableBody>
              {agents?.map((agent) => (
                <TableRow className="group" key={agent.id}>
                  <TableCell className="p-0">
                    <Link
                      className="flex items-center justify-between px-2 py-2.5 text-sm group-hover:underline"
                      href={`/agents/${agent.id}/playground`}
                    >
                      <span className="font-medium">{agent.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
