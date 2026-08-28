"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { segment: "sources", label: "Sources" },
  { segment: "playground", label: "Playground" },
  { segment: "settings", label: "Settings" },
  { segment: "embed", label: "Embed" },
] as const;

/**
 * Visually matches <Tabs>/<TabsList>/<TabsTrigger>, but each "tab" is a
 * real <Link> to its own route rather than a Base UI Tab switching a
 * same-page panel - the content lives in
 * agents/[id]/{sources,playground,settings,embed}/page.tsx, each
 * independently linkable/bookmarkable/back-buttonable. Base UI's Tabs
 * parts aren't reused here since their styling leans on group-data-*
 * selectors keyed to a <Tabs.Root> ancestor's own state, which a plain nav
 * of links has no equivalent for.
 */
export function AgentTabsNav({ agentId }: { agentId: string }) {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-[3px]"
    >
      {TABS.map((tab) => {
        const href = `/agents/${agentId}/${tab.segment}`;
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
