"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAgentName } from "@/hooks/use-agent-name";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs, type BreadcrumbTrailItem } from "@/components/dashboard/app-breadcrumbs";
import { getActiveAgentId, headerPageTitle } from "@/components/dashboard/app-shared";
import { CustomSidebarTrigger } from "@/components/dashboard/custom-sidebar-trigger";
import { UserDropdown } from "@/components/dashboard/user-dropdown";

export function AppHeader() {
  const pathname = usePathname();
  const activeAgentId = getActiveAgentId(pathname);
  const agentName = useAgentName(activeAgentId);

  const trail: BreadcrumbTrailItem[] = activeAgentId
    ? [
        { title: "Agents", href: "/agents" },
        // agentName resolves a moment after the id does (a client-side,
        // RLS-scoped fetch - the header sits outside the layout that
        // already has this name server-side) - just show one crumb until
        // it lands rather than a placeholder like "…".
        ...(agentName ? [{ title: agentName }] : []),
      ]
    : (() => {
        const page = headerPageTitle(pathname);
        return page ? [{ title: page.title }] : [];
      })();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs trail={trail} />
      </div>
      <div className="flex items-center gap-3">
        <UserDropdown />
      </div>
    </header>
  );
}
