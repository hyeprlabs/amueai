import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { getLatestChange } from "@/lib/changelog";

export async function AppShell({ children }: { children: React.ReactNode }) {
  // A transient DB hiccup shouldn't take the whole dashboard down.
  const latestChange = await getLatestChange().catch(() => undefined);

  return (
    <SidebarProvider>
      <AppSidebar latestChange={latestChange} />
      <SidebarInset>
        <AppHeader />
        <div className="flex w-full flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
