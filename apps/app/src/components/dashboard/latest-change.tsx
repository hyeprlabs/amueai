"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import type { Change } from "@/payload-types";

export function LatestChange({ change }: { change?: Change }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!change) return null;

  const href = `/changelog#${change.slug}`;

  return (
    <div
      className={cn(
        "group/latest-change min-w-(--sidebar-width) size-full min-h-27 justify-center border-t",
        "relative flex size-full flex-col gap-1 overflow-hidden px-4 pt-3 pb-1 *:text-nowrap",
        !isOpen && "pointer-events-none opacity-0",
        "will-change-[opacity] transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
      )}
    >
      <span className="font-light font-mono text-[10px] text-muted-foreground">CHANGELOG</span>
      <p className="font-medium text-xs">{change.title}</p>
      <span className="text-[10px] text-muted-foreground">{change.shortDescription}</span>
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
        onClick={() => setIsOpen(false)}
        size="icon-sm"
        variant="ghost"
      >
        <XIcon className="size-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
