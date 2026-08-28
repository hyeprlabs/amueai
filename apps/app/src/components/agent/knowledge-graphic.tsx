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
 * Four source chips feeding one agent core, with a pulse travelling each
 * connector to show ingestion happening continuously rather than once.
 *
 * The connectors are drawn as an SVG behind the chips so the geometry stays
 * fluid at any width; the chips themselves are laid out with flexbox.
 */
export function KnowledgeGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-sm items-center gap-3 sm:gap-4">
      <ul className="flex flex-1 flex-col gap-2">
        {sources.map((source, index) => (
          <motion.li
            animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
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

      {/*
        Connectors. The travelling pulse is a dashed overlay stroke whose
        offset animates, rather than a dot on an `offsetPath` — dash geometry
        scales with the viewBox, so it stays correct at every breakpoint.
      */}
      <svg
        aria-hidden="true"
        className="h-32 w-8 shrink-0 sm:w-12"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 48 128"
      >
        {[16, 48, 80, 112].map((y, index) => {
          const d = `M0 ${y} C 24 ${y}, 24 64, 48 64`;

          return (
            <g key={y}>
              <path className="stroke-border" d={d} strokeWidth="1" />
              {!reduced && (
                <motion.path
                  animate={{ strokeDashoffset: [60, 0] }}
                  className="stroke-foreground/50"
                  d={d}
                  strokeDasharray="6 54"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: index * 0.5,
                    ease: "linear",
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border bg-card shadow-xs sm:size-20">
        {!reduced && (
          <motion.span
            animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
            className="absolute inset-0 rounded-full border"
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
          />
        )}
        <BotIcon className="size-6 sm:size-7" />
      </div>
    </div>
  );
}
