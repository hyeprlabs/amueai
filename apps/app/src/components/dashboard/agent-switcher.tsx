"use client";

import Link from "next/link";
import { BotIcon, CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon-tile";
import { SidebarMenu, SidebarMenuItem, sidebarMenuButtonVariants } from "@/components/ui/sidebar";

export type AgentSwitcherAgent = { id: string; name: string };

/**
 * The sidebar's agent-face header - swaps which agent the rest of the
 * sidebar's Playground/Build/Analytics/Channels/Settings nav points at.
 * Same shape as the classic shadcn "team switcher" sidebar block, just
 * scoped to agents instead of workspaces.
 */
export function AgentSwitcher({
  agents,
  currentAgentId,
}: {
  agents: AgentSwitcherAgent[];
  currentAgentId: string;
}) {
  const currentAgent = agents.find((agent) => agent.id === currentAgentId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          {/*
            No `render={<SidebarMenuButton />}` here on purpose - nesting one
            polymorphic `useRender` component inside another (Menu.Trigger's
            own render target) doubled up the ref/prop merging and threw on
            open. A native trigger styled with the same button's own variant
            classes gets the identical look without that fragile composition.
          */}
          <DropdownMenuTrigger
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "w-full border border-sidebar-border",
            )}
          >
            <IconTile variant="soft" size="sm">
              <BotIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate font-medium">{currentAgent?.name ?? "Agent"}</span>
              <span className="text-xs text-muted-foreground">Switch agent</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Agents</DropdownMenuLabel>
            {agents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                render={<Link href={`/agents/${agent.id}/overview`} />}
              >
                <BotIcon className="text-muted-foreground" />
                <span className="truncate">{agent.name}</span>
                {agent.id === currentAgentId && <CheckIcon className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/new" />}>
              <PlusIcon />
              New agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
