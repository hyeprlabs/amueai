"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { BotIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon-tile";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select";
import { SidebarMenu, SidebarMenuItem, sidebarMenuButtonVariants } from "@/components/ui/sidebar";
import { getAgentSubPath } from "@/components/dashboard/app-shared";

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
 *
 * The trigger uses the bare `SelectPrimitive.Trigger`, not this file's
 * pre-styled `SelectTrigger` export - that one bakes in its own chrome
 * (border-input, rounded-lg, a fixed h-8/h-7 via a `data-size` variant, a
 * built-in chevron-down) which fights the sidebar button's own "lg" sizing
 * classes instead of yielding to them, visibly shrinking the switcher.
 * Styling the unstyled trigger with exactly the classes the old
 * DropdownMenu-based version used reproduces that look precisely.
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
  const currentAgent = agents.find((agent) => agent.id === currentAgentId);
  const items = Object.fromEntries(agents.map((agent) => [agent.id, agent.name]));

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Select
          value={currentAgentId}
          onValueChange={(next: unknown) =>
            router.push(`/agents/${next}${getAgentSubPath(pathname, currentAgentId)}`)
          }
          items={items}
        >
          <SelectPrimitive.Trigger
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
          </SelectPrimitive.Trigger>
          <SelectContent align="start" className="w-64">
            <SelectGroup>
              <SelectLabel>Agents</SelectLabel>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <BotIcon className="text-muted-foreground" />
                  <span className="truncate">{agent.name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
