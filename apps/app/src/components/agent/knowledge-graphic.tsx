"use client";

import { motion, useReducedMotion } from "motion/react";
import { BotIcon, FileTextIcon, GlobeIcon, MessagesSquareIcon, TypeIcon } from "lucide-react";

const sources = [
  { label: "Website", icon: <GlobeIcon /> },
  { label: "PDF", icon: <FileTextIcon /> },
  { label: "Text", icon: <TypeIcon /> },
  { label: "Q&A", icon: <MessagesSquareIcon /> },
];

/**
 * Source chips stacked above the agent they train, joined by a single vertical
 * rail. Each chip lights up in turn and a pulse runs down the rail, so the
 * whole idea reads as "these become that" without any curve geometry to get
 * wrong at a breakpoint.
 */
export function KnowledgeGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <ul className="grid w-full grid-cols-2 gap-2">
        {sources.map((source, index) => (
          <motion.li
            animate={reduced ? undefined : { opacity: [0.5, 1, 0.5] }}
            className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 shadow-xs"
            key={source.label}
            transition={
              reduced
                ? undefined
                : {
                    duration: 3.2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: index * 0.4,
                    ease: "easeInOut",
                  }
            }
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-background [&_svg]:size-3">
              {source.icon}
            </span>
            <span className="truncate font-medium text-xs">{source.label}</span>
          </motion.li>
        ))}
      </ul>

      {/* One straight rail: a dashed pulse runs top to bottom on a loop. */}
      <div className="relative h-10 w-px bg-border">
        {!reduced && (
          <motion.span
            animate={{ y: [0, 40], opacity: [0, 1, 0] }}
            className="absolute -left-px block h-3 w-0.5 rounded-full bg-foreground/60"
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="flex size-14 items-center justify-center rounded-full border bg-card shadow-xs">
        <BotIcon className="size-6" />
      </div>

      <p className="mt-3 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        Your agent
      </p>
    </div>
  );
}
