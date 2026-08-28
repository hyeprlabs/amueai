"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ReactCountryFlag from "react-country-flag";

import { accents } from "@/components/agent/accent";
import { cn } from "@/lib/utils";

/** The same question, answered from the same source, in four languages. */
const phrasings = [
  { country: "GB", text: "Do you ship to Germany?" },
  { country: "DE", text: "Liefert ihr nach Deutschland?" },
  { country: "ES", text: "¿Envían a Alemania?" },
  { country: "FR", text: "Vous livrez en Allemagne ?" },
] as const;

const accent = accents.amber;
const HOLD_MS = 2200;

/**
 * Cycles through the same question in four languages via a stepped index and
 * `AnimatePresence`, so exactly one phrase is ever mounted, never a
 * fraction-of-a-loop gap between them. The flag is the actual point: a visitor
 * recognises their own language's flag faster than they read the words.
 */
export function LanguagesGraphic() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % phrasings.length),
      HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [index, reduced]);

  const current = phrasings[reduced ? 0 : index];

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-3 sm:max-w-[17rem]">
      <div className="relative flex h-16 w-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex max-w-full items-center gap-2 text-balance rounded-lg border px-2.5 py-1.5 text-[11px] leading-relaxed",
              accent.tint,
              accent.border,
              accent.text,
            )}
            exit={{ opacity: 0, y: -4 }}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            key={current.country}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ReactCountryFlag
              aria-label={current.country}
              countryCode={current.country}
              style={{ fontSize: "1rem", lineHeight: "1rem" }}
            />
            <span>{current.text}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <span aria-hidden="true" className="h-4 w-px bg-border" />

      <p className="rounded-lg rounded-bl-sm border bg-card px-2.5 py-1.5 text-[11px] leading-relaxed shadow-xs">
        One answer, one source.
      </p>
    </div>
  );
}
