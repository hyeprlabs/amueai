"use client";

import { forwardRef, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isNavItemActive, type SidebarNavGroup } from "@/components/dashboard/app-shared";

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

/** A flat list of nav links - the sidebar has no collapsible groups. */
export function NavGroup({ label, items }: SidebarNavGroup) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isNavItemActive(item.path, pathname)}
              render={<NavLink href={item.path} />}
              tooltip={item.title}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
