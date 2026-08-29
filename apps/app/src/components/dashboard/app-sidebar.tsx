"use client";

import { cn } from "@/lib/utils";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  footerNavLinks,
  getActiveAgentId,
  getAgentNavGroups,
  primaryNavGroups,
} from "@/components/dashboard/app-shared";
import { AgentSwitcher, type AgentSwitcherAgent } from "@/components/dashboard/agent-switcher";
import { LatestChange } from "@/components/dashboard/latest-change";
import { NavGroup } from "@/components/dashboard/nav-group";
import type { Change } from "@/payload-types";

export function AppSidebar({
  latestChange,
  agents,
}: {
  latestChange?: Change;
  agents: AgentSwitcherAgent[];
}) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeAgentId = getActiveAgentId(pathname);
  const navGroups = activeAgentId ? getAgentNavGroups(activeAgentId) : primaryNavGroups;

  return (
    <Sidebar
      className={cn(
        "*:data-[slot=sidebar-inner]:bg-background",
        "*:data-[slot=sidebar-inner]:overflow-hidden",
        "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75",
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b px-2">
        {state === "expanded" && !mounted && <Skeleton className="h-[28px] w-36 rounded-md" />}
        {state === "expanded" && mounted && (
          <OrganizationSwitcher fallback={<Skeleton className="h-[28px] w-36 rounded-md" />} />
        )}
      </SidebarHeader>
      <SidebarContent>
        {activeAgentId && (
          <div className="px-2 pt-2">
            <AgentSwitcher agents={agents} currentAgentId={activeAgentId} />
          </div>
        )}
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <LatestChange change={latestChange} />
        <SidebarMenu className="border-t p-2">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="text-muted-foreground"
                isActive={item.isActive}
                render={<a href={item.path} />}
                size="sm"
                tooltip={item.title}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <p className="text-nowrap text-[9px] text-muted-foreground">
            © {new Date().getFullYear()} AmueAI
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
