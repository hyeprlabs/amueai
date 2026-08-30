"use client";

import { useRouter } from "next/navigation";
import { BotIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon-tile";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SidebarMenu, SidebarMenuItem, sidebarMenuButtonVariants } from "@/components/ui/sidebar";

export type AgentSwitcherAgent = { id: string; name: string };

/**
 * The sidebar's agent-face header - swaps which agent the rest of the
 * sidebar's Playground/Build/Analytics/Channels/Settings nav points at.
 *
 * Built on Select rather than DropdownMenu: an earlier DropdownMenu +
 * DropdownMenuItem-rendered-as-<Link> version was unreliable (Base UI's
 * Menu item/link composition, portal timing, take your pick). Select is
 * the same primitive family already proven in this app for "pick one,
 * something happens" (the model switcher, the theme switcher) - a plain
 * value change here, handled with a `router.push`, sidesteps that
 * fragility entirely instead of debugging it further.
 */
export function AgentSwitcher({
  agents,
  currentAgentId,
}: {
  agents: AgentSwitcherAgent[];
  currentAgentId: string;
}) {
  const router = useRouter();
  const currentAgent = agents.find((agent) => agent.id === currentAgentId);
  const items = Object.fromEntries(agents.map((agent) => [agent.id, agent.name]));

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Select
          value={currentAgentId}
          onValueChange={(next: unknown) => router.push(`/agents/${next}/overview`)}
          items={items}
        >
          <SelectTrigger
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "w-full justify-start border border-sidebar-border",
            )}
          >
            <IconTile variant="soft" size="sm">
              <BotIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate font-medium">{currentAgent?.name ?? "Agent"}</span>
              <span className="text-xs text-muted-foreground">Switch agent</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
