"use client";

import { motion, useReducedMotion } from "motion/react";
import { FileTextIcon, GlobeIcon, MessagesSquareIcon, SparklesIcon, TypeIcon } from "lucide-react";

import { accents, type AccentName } from "@/components/agent/accent";
import { cn } from "@/lib/utils";

const sources: { label: string; icon: React.ReactNode; accent: AccentName }[] = [
  { label: "Website", icon: <GlobeIcon />, accent: "blue" },
  { label: "PDF", icon: <FileTextIcon />, accent: "rose" },
  { label: "Text", icon: <TypeIcon />, accent: "amber" },
  { label: "Q&A", icon: <MessagesSquareIcon />, accent: "emerald" },
];

/**
 * Four coloured source chips feeding one core. Each chip lifts and brightens in
 * turn, sends a dot of its own colour down into the core, and the core pulses
 * as it lands, so the sequence reads as ingestion rather than decoration.
 */
export function SourcesGraphic() {
  const reduced = useReducedMotion();
  const cycle = sources.length * 0.9;

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-3 sm:max-w-[17rem]">
      <ul className="grid w-full grid-cols-2 gap-2">
        {sources.map((source, index) => {
          const accent = accents[source.accent];

          return (
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
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border [&_svg]:size-3",
                  accent.tint,
                  accent.border,
                  accent.text,
                )}
              >
                {source.icon}
              </span>
              <span className="truncate font-medium text-[11px]">{source.label}</span>
            </motion.li>
          );
        })}
      </ul>

      {/* Rail: one coloured dot per source runs down it, in the chip order. */}
      <div className="relative h-8 w-px bg-border">
        {!reduced &&
          sources.map((source, index) => (
            <motion.span
              animate={{ y: [0, 32], opacity: [0, 1, 1, 0] }}
              className={cn(
                "absolute -left-[1.5px] block size-1 rounded-full",
                accents[source.accent].fill,
              )}
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

      <div className="relative flex size-12 items-center justify-center rounded-full border bg-card shadow-xs">
        {!reduced && (
          <motion.span
            animate={{ scale: [1, 1.5], opacity: [0.45, 0] }}
            className="absolute inset-0 rounded-full border border-violet-500/50"
            transition={{
              duration: cycle / sources.length,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
          />
        )}
        <SparklesIcon className={cn("size-5", accents.violet.text)} />
      </div>
    </div>
  );
}
