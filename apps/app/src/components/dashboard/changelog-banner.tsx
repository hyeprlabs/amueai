"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import type { Change } from "@/payload-types";

const DISMISSED_UNTIL_KEY = "amueai_latest_change_dismissed_date";

/** Today's date as YYYY-MM-DD - the same shape the sidebar's own open/closed cookie compares against, so "dismissed today" reads the same way across this app. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ChangelogBanner({ change }: { change?: Change }) {
  const [isOpen, setIsOpen] = useState(true);

  // Runs client-side only (localStorage isn't available during the server
  // render), so this starts open and can flip closed once mounted - a
  // one-frame flash is an acceptable cost for a low-stakes changelog
  // banner, rather than plumbing this through cookies/SSR like the
  // sidebar's own open state.
  useEffect(() => {
    if (localStorage.getItem(DISMISSED_UNTIL_KEY) === today()) setIsOpen(false);
  }, []);

  if (!change) return null;

  const href = `/changelog#${change.slug}`;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_UNTIL_KEY, today());
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        "group/changelog-banner min-w-(--sidebar-width) size-full min-h-27 justify-center border-t",
        "relative flex size-full flex-col gap-1 overflow-hidden px-4 pt-3 pb-1",
        !isOpen && "pointer-events-none opacity-0",
        "will-change-[opacity] transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
      )}
    >
      <span className="text-nowrap font-light font-mono text-[10px] text-muted-foreground">
        CHANGELOG
      </span>
      <p className="truncate text-nowrap font-medium text-xs">{change.title}</p>
      <span className="line-clamp-2 text-wrap text-[10px] text-muted-foreground">
        {change.shortDescription}
      </span>
      <Button
        className="w-max px-0 font-light text-xs"
        nativeButton={false}
        render={<a href={href} />}
        size="sm"
        variant="link"
      >
        Learn more
      </Button>
      <Button
        aria-label="Dismiss"
        className="absolute top-2 right-2 z-10 size-6 rounded-full opacity-0 transition-opacity group-hover/latest-change:opacity-100"
        onClick={dismiss}
        size="icon-sm"
        variant="ghost"
      >
        <XIcon className="size-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
