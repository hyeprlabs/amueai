"use client";

import { motion, useReducedMotion } from "motion/react";

import { accents, type AccentName } from "@/components/agent/accent";
import { cn } from "@/lib/utils";

/** The same question, cycling through languages in place. */
const phrasings: { text: string; accent: AccentName }[] = [
  { text: "Do you ship to Germany?", accent: "blue" },
  { text: "Liefert ihr nach Deutschland?", accent: "amber" },
  { text: "¿Envían a Alemania?", accent: "rose" },
  { text: "Vous livrez en Allemagne ?", accent: "emerald" },
];

const LOOP = phrasings.length * 1.8;

export function LanguagesGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-3 sm:max-w-[17rem]">
      {/* Each phrasing occupies the same cell, so they swap rather than stack. */}
      <div className="grid w-full place-items-center">
        {phrasings.map((phrasing, index) => {
          const accent = accents[phrasing.accent];
          const start = index / phrasings.length;

          return (
            <motion.span
              animate={
                reduced
                  ? { opacity: index === 0 ? 1 : 0 }
                  : { opacity: [0, 1, 1, 0], scale: [0.96, 1, 1, 0.96] }
              }
              className={cn(
                "col-start-1 row-start-1 text-balance rounded-lg border px-2.5 py-1.5 text-center text-[11px] leading-relaxed",
                accent.tint,
                accent.border,
                accent.text,
              )}
              initial={false}
              key={phrasing.text}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      duration: LOOP,
                      times: [start, start + 0.04, start + 0.21, start + 0.25],
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }
              }
            >
              {phrasing.text}
            </motion.span>
          );
        })}
      </div>

      <span aria-hidden="true" className="h-4 w-px bg-border" />

      <p className="rounded-lg rounded-bl-sm border bg-card px-2.5 py-1.5 text-[11px] leading-relaxed shadow-xs">
        One answer, one source.
      </p>
    </div>
  );
}
