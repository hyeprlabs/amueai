"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/dashboard/app-breadcrumbs";
import { headerPageTitle } from "@/components/dashboard/app-shared";
import { CustomSidebarTrigger } from "@/components/dashboard/custom-sidebar-trigger";
import { UserDropdown } from "@/components/dashboard/user-dropdown";
import { SendIcon, BellIcon } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const activeItem = headerPageTitle(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50",
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={activeItem} />
      </div>
      <div className="flex items-center gap-3">
        <Button aria-label="Send" size="icon-sm" variant="outline">
          <SendIcon />
        </Button>
        <Button aria-label="Notifications" size="icon-sm" variant="outline">
          <BellIcon />
        </Button>
        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        <UserDropdown />
      </div>
    </header>
  );
}
