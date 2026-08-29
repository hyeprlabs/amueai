"use client";

import { forwardRef, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  getActiveAgentId,
  getAgentSubNav,
  isNavItemActive,
  type SidebarNavGroup,
} from "@/components/dashboard/app-shared";
import { ChevronRightIcon } from "lucide-react";

/**
 * Used as a Base UI `render` element (SidebarMenuButton clones it via
 * useRender, merging in ref/className/data-active/onClick), so it has to
 * forward everything it's given onto the actual anchor - a plain
 * component that swallows those merged props would silently break the
 * active-state styling and focus ref. Real routes (paths starting with
 * "/") get client-side nav via next/link; stub "#/..." placeholders
 * that have no page yet fall back to a plain anchor.
 */
const NavLink = forwardRef<HTMLAnchorElement, ComponentProps<"a">>(function NavLink(
  { href, ...props },
  ref,
) {
  if (href?.startsWith("/")) {
    return <Link href={href} ref={ref} {...props} />;
  }
  return <a href={href} ref={ref} {...props} />;
});

export function NavGroup({ label, items }: SidebarNavGroup) {
  const pathname = usePathname();
  const activeAgentId = getActiveAgentId(pathname);

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((rawItem) => {
          // The sidebar can't statically list an agent's own sub-pages
          // (Playground/Build/Analytics/Channels/Settings) since they're
          // keyed by whichever agent id is currently open - swap them in
          // here once the route reveals which agent that is.
          const item =
            rawItem.path === "/agents" && activeAgentId
              ? { ...rawItem, subItems: getAgentSubNav(activeAgentId) }
              : rawItem;

          const isActive = isNavItemActive(item.path, pathname);
          const subItemsActive =
            item.subItems?.map((subItem) => isNavItemActive(subItem.path, pathname)) ?? [];
          const anySubActive = subItemsActive.some(Boolean);

          return (
            <Collapsible
              className="group/collapsible"
              defaultOpen={isActive || anySubActive}
              key={item.title}
            >
              <SidebarMenuItem>
                {item.subItems?.length ? (
                  <>
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuButton
                          isActive={isActive || anySubActive}
                          tooltip={item.title}
                        />
                      }
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems?.map((subItem, i) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              isActive={subItemsActive[i]}
                              render={<NavLink href={subItem.path} />}
                            >
                              {subItem.icon}
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    isActive={isActive}
                    render={<NavLink href={item.path} />}
                    tooltip={item.title}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
