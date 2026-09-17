"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotIcon, ChevronRightIcon, GaugeIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import {
  footerNavLinks,
  getActiveAgentId,
  getAgentNavGroups,
  isNavItemActive,
  type SidebarNavItem,
} from "@/components/dashboard/app-shared";

export function findActiveNavItem(pathname: string): SidebarNavItem | undefined {
  return [
    { title: "Agents", path: "/agents" },
    { title: "Usage", path: "/usage" },
    ...footerNavLinks,
  ]
    .filter((item) => isNavItemActive(item.path, pathname))
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))[0];
}

export function headerPageTitle(pathname: string): SidebarNavItem | undefined {
  const activeItem = findActiveNavItem(pathname);
  if (activeItem) return activeItem;

  const firstSegment = pathname.split("/").find(Boolean);
  if (!firstSegment) return undefined;

  return { title: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1) };
}

export function NavOverview() {
  const pathname = usePathname();
  if (getActiveAgentId(pathname)) return null;

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isNavItemActive("/agents", pathname)}
            render={<Link href="/agents" />}
            tooltip="Agents"
          >
            <BotIcon />
            <span>Agents</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isNavItemActive("/usage", pathname)}
            render={<Link href="/usage" />}
            tooltip="Usage"
          >
            <GaugeIcon />
            <span>Usage</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function NavAgent() {
  const pathname = usePathname();
  const agentId = getActiveAgentId(pathname);
  if (!agentId) return null;

  return (
    <>
      {getAgentNavGroups(agentId).map((group, index) => (
        <SidebarGroup key={`agent-${index}`}>
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive = isNavItemActive(item.path, pathname);

              if (!item.subItems?.length) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={item.path ?? "#"} />}
                      tooltip={item.title}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              const subItemsActive = item.subItems.map((sub) =>
                isNavItemActive(sub.path, pathname),
              );
              const anySubActive = subItemsActive.some(Boolean);

              return (
                <Collapsible
                  className="group/collapsible"
                  defaultOpen={isActive || anySubActive}
                  key={item.title}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      className={cn(sidebarMenuButtonVariants(), "w-full")}
                      {...(isActive || anySubActive ? { "data-active": true } : {})}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems.map((sub, i) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              isActive={subItemsActive[i]}
                              render={<Link href={sub.path ?? "#"} />}
                            >
                              {sub.icon}
                              <span>{sub.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
