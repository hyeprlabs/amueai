"use client";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/logo";
import { useScroll } from "@/hooks/use-scroll";
import { HeaderActions } from "@/components/header-actions";
import { DesktopNav } from "@/components/desktop-nav";
import { MobileNav } from "@/components/mobile-nav";

export function Header({ waitlistEnabled }: { waitlistEnabled: boolean }) {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-4xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        {
          "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-3xl md:shadow":
            scrolled,
        },
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          {
            "md:px-2": scrolled,
          },
        )}
      >
        <div className="flex items-center gap-5">
          <Link
            aria-label={`${siteConfig.name} home`}
            className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50"
            href="/"
          >
            <Logo className="h-4" />
          </Link>
          <DesktopNav />
        </div>
        <HeaderActions waitlistEnabled={waitlistEnabled} />
        <MobileNav />
      </nav>
    </header>
  );
}
