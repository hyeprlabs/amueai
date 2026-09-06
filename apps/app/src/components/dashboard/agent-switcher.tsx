"use client";

import { usePathname, useRouter } from "next/navigation";
import { BotIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconTile } from "@/components/ui/icon-tile";
import { SidebarMenu, SidebarMenuItem, sidebarMenuButtonVariants } from "@/components/ui/sidebar";
import { getAgentSubPath } from "@/components/dashboard/nav-config";

export type AgentSwitcherAgent = { id: string; name: string };

/**
 * The sidebar's agent-face header - swaps which agent the rest of the
 * sidebar's Playground/Build/Analytics/Channels/Settings nav points at.
 * Same shape as shadcn's classic TeamSwitcher block, scoped to agents.
 *
 * Two things are done deliberately differently from a copy-paste of that
 * block, both learned the hard way from an earlier version of this exact
 * component that crashed in production:
 *
 * 1. The trigger is `DropdownMenuTrigger` styled directly with the sidebar
 *    button's own variant classes, not `DropdownMenuTrigger asChild`
 *    wrapping a `<SidebarMenuButton>`. Nesting one polymorphic `render`-
 *    based component inside another's render target (here, Menu.Trigger's)
 *    doubles up ref/prop merging and broke the trigger outright - applying
 *    the same classes to a plain element gets an identical look for free.
 * 2. Every item navigates via a plain `onClick` (router.push), not a
 *    `<Link>` rendered through the item - Base UI's Menu item/link
 *    composition was the other half of that same crash.
 */
export function AgentSwitcher({
  agents,
  currentAgentId,
}: {
  agents: AgentSwitcherAgent[];
  currentAgentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeAgent = agents.find((agent) => agent.id === currentAgentId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              sidebarMenuButtonVariants({ size: "lg", variant: "outline" }),
              "w-full bg-transparent data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground",
            )}
          >
            <IconTile size="sm" variant="frame">
              <BotIcon />
            </IconTile>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeAgent?.name ?? "Agent"}</span>
              <span className="truncate text-xs">Switch agent</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Agents
              </DropdownMenuLabel>
              {agents.map((agent) => (
                <DropdownMenuItem
                  className="gap-2 p-2"
                  key={agent.id}
                  onClick={() =>
                    router.push(`/agents/${agent.id}${getAgentSubPath(pathname, currentAgentId)}`)
                  }
                >
                  <IconTile size="xs" variant="outline">
                    <BotIcon />
                  </IconTile>
                  {agent.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => router.push("/new")}>
              <IconTile size="xs" variant="outline">
                <PlusIcon />
              </IconTile>
              <div className="font-medium text-muted-foreground">Add Agent</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
