import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { getLatestChange } from "@/lib/changelog";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * A closed sidebar should stay closed across page loads, but only for the
 * day it was closed on - the next calendar day it reopens by default. The
 * cookie is stamped with the date it was written (see ui/sidebar.tsx); a
 * missing or stale-dated cookie falls back to expanded.
 */
async function resolveSidebarDefaultOpen(): Promise<boolean> {
  const cookieStore = await cookies();
  const state = cookieStore.get("sidebar_state")?.value;
  const stateDate = cookieStore.get("sidebar_state_date")?.value;
  const today = new Date().toISOString().slice(0, 10);

  if (!state || stateDate !== today) return true;
  return state === "true";
}

/** The sidebar's agent-switcher only needs enough to list and link agents. */
async function getSwitcherAgents() {
  const { orgId } = await auth();
  if (!orgId) return [];

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  // A transient DB hiccup shouldn't take the whole dashboard down.
  const [latestChange, defaultOpen, agents] = await Promise.all([
    getLatestChange().catch(() => undefined),
    resolveSidebarDefaultOpen(),
    getSwitcherAgents().catch(() => []),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar latestChange={latestChange} agents={agents} />
      <SidebarInset>
        <AppHeader />
        <div className="flex w-full flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
