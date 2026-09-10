"use client";

import { forwardRef, type ComponentProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
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
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import { isNavItemActive, type SidebarNavGroup } from "@/components/dashboard/nav-config";

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

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isActive = isNavItemActive(item.path, pathname);

          if (!item.subItems?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={isActive}
                  render={<NavLink href={item.path} />}
                  tooltip={item.title}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const subItemsActive = item.subItems.map((sub) => isNavItemActive(sub.path, pathname));
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
                          render={<NavLink href={sub.path} />}
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
  );
}
