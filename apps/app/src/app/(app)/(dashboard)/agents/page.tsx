import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { BotIcon, TriangleAlertIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CreateAgentDialog } from "./create-agent-dialog";

export const metadata: Metadata = createMetadata({
  title: "Agents",
  description: "The agents trained on your data.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BotIcon />
          </EmptyMedia>
          <EmptyTitle>Select or create a workspace</EmptyTitle>
          <EmptyDescription>
            AmueAI workspaces are Clerk organizations. Pick one from the switcher to see its agents.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <OrganizationSwitcher hidePersonal />
        </EmptyContent>
      </Empty>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <Empty className="border border-dashed border-destructive/30 bg-destructive/5">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load agents</EmptyTitle>
          <EmptyDescription className="text-destructive">{error.message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Agents trained on your data, scoped to this workspace.
          </p>
        </div>
        {agents.length > 0 && <CreateAgentDialog />}
      </div>

      {agents.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BotIcon />
            </EmptyMedia>
            <EmptyTitle>No agents yet</EmptyTitle>
            <EmptyDescription>
              Create your first agent, then add text or URL sources to train it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateAgentDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-foreground/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BotIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{agent.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
