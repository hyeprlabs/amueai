import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BotIcon, ChevronRightIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";
import { NoWorkspace } from "@/components/dashboard/no-workspace";

export const metadata: Metadata = createMetadata({
  title: "Agents",
  description: "The agents trained on your data.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentsPage() {
  const { orgId } = await auth();

  if (!orgId) return <NoWorkspace />;

  const supabase = await createServerSupabaseClient();
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <DashboardEmpty
        description={error.message}
        icon={<TriangleAlertIcon />}
        title="Couldn't load agents"
        variant="destructive"
      />
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
        {agents.length > 0 && (
          <Button nativeButton={false} render={<Link href="/new" />}>
            <PlusIcon />
            New agent
          </Button>
        )}
      </div>

      {agents.length === 0 ? (
        <DashboardEmpty
          description="Create your first agent, then add URL sources to train it."
          icon={<BotIcon />}
          title="No agents yet"
        >
          <Button nativeButton={false} render={<Link href="/new" />}>
            <PlusIcon />
            New agent
          </Button>
        </DashboardEmpty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link className="group" href={`/agents/${agent.id}/playground`} key={agent.id}>
              <Card className="flex-row items-center gap-3 p-4 transition-shadow group-hover:shadow-md group-hover:ring-foreground/20">
                <IconTile variant="soft">
                  <BotIcon />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
