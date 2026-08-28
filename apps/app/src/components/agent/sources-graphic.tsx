"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CpuIcon, FileTextIcon, GlobeIcon, MessagesSquareIcon, TypeIcon } from "lucide-react";

import { accents } from "@/components/agent/accent";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

const sources = [
  { label: "Website", icon: <GlobeIcon /> },
  { label: "PDF", icon: <FileTextIcon /> },
  { label: "Text", icon: <TypeIcon /> },
  { label: "Q&A", icon: <MessagesSquareIcon /> },
];

const accent = accents.blue;
const HOLD_MS = 1000;
const TRAVEL_S = 0.6;

/** Each row's vertical centre as a percentage of the stack, core sits at 50%. */
const rowPercent = (index: number) => ((index + 0.5) / sources.length) * 100;

/**
 * Four sources stacked vertically, each a real `IconTile`, the same square the
 * nav uses for its feature list. One source at a time highlights, and a pulse
 * actually travels its connector line down into the engine, rather than
 * blinking in place: the `top` position is what animates, from the row's own
 * height to the core's, keyed by index so each lap restarts from a clean state.
 */
export function SourcesGraphic() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setActive((current) => (current + 1) % sources.length), HOLD_MS);
    return () => clearTimeout(timer);
  }, [active, reduced]);

  return (
    <div className="flex w-full max-w-[16rem] items-center gap-3 sm:max-w-[18rem]">
      <ul className="flex flex-1 flex-col gap-2">
        {sources.map((source, index) => (
          <li className="flex items-center gap-2" key={source.label}>
            <IconTile
              aria-hidden="true"
              className={cn(
                "transition-colors duration-300",
                !reduced && index === active && accent.text,
              )}
              size="sm"
              variant="frame"
            >
              {source.icon}
            </IconTile>
            <span className="truncate font-medium text-xs">{source.label}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </li>
        ))}
      </ul>

      {/* Connector: visual line from active source to engine. */}
      <div className="relative flex w-8 shrink-0 justify-center self-stretch sm:w-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-border" />
        </div>
        {!reduced && (
          <motion.div
            className={cn("absolute left-1/2 -translate-x-1/2 w-0.5", accent.fill)}
            animate={{
              top: `${Math.min(rowPercent(active), 50)}%`,
              height: `${Math.abs(50 - rowPercent(active))}%`,
            }}
            initial={{
              top: `${Math.min(rowPercent(0), 50)}%`,
              height: `${Math.abs(50 - rowPercent(0))}%`,
            }}
            transition={{ duration: 0.3 }}
            key={`connector-${active}`}
          />
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <IconTile aria-hidden="true" radius="full" size="lg" variant="frame">
          <CpuIcon />
        </IconTile>
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Engine
        </span>
      </div>
    </div>
  );
}
