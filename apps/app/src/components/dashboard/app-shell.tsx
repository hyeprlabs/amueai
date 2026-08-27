import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { getLatestChange } from "@/lib/changelog";

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

export async function AppShell({ children }: { children: React.ReactNode }) {
  // A transient DB hiccup shouldn't take the whole dashboard down.
  const [latestChange, defaultOpen] = await Promise.all([
    getLatestChange().catch(() => undefined),
    resolveSidebarDefaultOpen(),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar latestChange={latestChange} />
      <SidebarInset>
        <AppHeader />
        <div className="flex w-full flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
