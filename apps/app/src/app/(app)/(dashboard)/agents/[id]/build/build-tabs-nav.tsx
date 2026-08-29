"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { segment: "sources", label: "Sources" },
  { segment: "embed", label: "Embed" },
] as const;

/** Same real-<Link>-per-tab pattern as AgentTabsNav, one level down. */
export function BuildTabsNav({ agentId }: { agentId: string }) {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-[3px]"
    >
      {TABS.map((tab) => {
        const href = `/agents/${agentId}/build/${tab.segment}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={tab.segment}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex h-[calc(2rem-6px)] items-center justify-center rounded-md px-2.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
              isActive && "bg-background text-foreground shadow-sm dark:bg-input/30",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
