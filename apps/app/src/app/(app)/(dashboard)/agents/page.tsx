import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAgent } from "./actions";

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
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
        <div>
          <h1 className="text-lg font-medium">Select or create a workspace</h1>
          <p className="text-sm text-muted-foreground">
            AmueAI workspaces are Clerk organizations. Pick one from the switcher to see its agents.
          </p>
        </div>
        <OrganizationSwitcher hidePersonal />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
        Couldn&apos;t load agents: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Agents</h1>
        <p className="text-sm text-muted-foreground">
          Agents trained on your data, scoped to this workspace.
        </p>
      </div>

      <form action={createAgent} className="flex items-center gap-2">
        <Input name="name" placeholder="e.g. Acme Support" required className="max-w-xs" />
        <Button type="submit">New agent</Button>
      </form>

      {agents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
          No agents yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {agents.map((agent) => (
            <li key={agent.id}>
              <Link
                href={`/agents/${agent.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <span className="font-medium">{agent.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(agent.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
