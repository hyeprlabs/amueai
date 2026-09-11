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
