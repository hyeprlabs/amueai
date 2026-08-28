"use client";

import { motion, useReducedMotion } from "motion/react";
import { FileTextIcon, GlobeIcon, MessagesSquareIcon, SparklesIcon, TypeIcon } from "lucide-react";

import { accents } from "@/components/agent/accent";
import { cn } from "@/lib/utils";

const sources = [
  { label: "Website", icon: <GlobeIcon /> },
  { label: "PDF", icon: <FileTextIcon /> },
  { label: "Text", icon: <TypeIcon /> },
  { label: "Q&A", icon: <MessagesSquareIcon /> },
];

const accent = accents.blue;

/**
 * Four source chips feeding one core, all in one accent colour: chips stay
 * neutral, and the colour is reserved for the thing actually happening, the
 * pulse travelling the rail and the core it lands in. Each chip lifts in turn,
 * sends its pulse down, and the core rings as it lands.
 */
export function SourcesGraphic() {
  const reduced = useReducedMotion();
  const cycle = sources.length * 0.9;

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-3 sm:max-w-[17rem]">
      <ul className="grid w-full grid-cols-2 gap-2">
        {sources.map((source, index) => (
          <motion.li
            animate={reduced ? undefined : { y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5 shadow-xs"
            key={source.label}
            transition={
              reduced
                ? undefined
                : {
                    duration: cycle,
                    times: [0, index / sources.length + 0.06, 1],
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
            }
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground [&_svg]:size-3">
              {source.icon}
            </span>
            <span className="truncate font-medium text-[11px]">{source.label}</span>
          </motion.li>
        ))}
      </ul>

      {/* Rail: one pulse per source runs down it, in the chip order. */}
      <div className="relative h-8 w-px bg-border">
        {!reduced &&
          sources.map((source, index) => (
            <motion.span
              animate={{ y: [0, 32], opacity: [0, 1, 1, 0] }}
              className={cn("absolute -left-[1.5px] block size-1 rounded-full", accent.fill)}
              key={source.label}
              transition={{
                duration: cycle,
                times: [
                  index / sources.length,
                  index / sources.length + 0.04,
                  index / sources.length + 0.16,
                  index / sources.length + 0.2,
                ],
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          ))}
      </div>

      <div
        className={cn(
          "relative flex size-12 items-center justify-center rounded-full border bg-card shadow-xs",
          accent.border,
        )}
      >
        {!reduced && (
          <motion.span
            animate={{ scale: [1, 1.5], opacity: [0.45, 0] }}
            className={cn("absolute inset-0 rounded-full border", accent.border)}
            transition={{
              duration: cycle / sources.length,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
          />
        )}
        <SparklesIcon className={cn("size-5", accent.text)} />
      </div>
    </div>
  );
}
