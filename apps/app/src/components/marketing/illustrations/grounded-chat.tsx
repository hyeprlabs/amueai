"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileTextIcon, SparklesIcon } from "lucide-react";

import { accents } from "./accent";
import { cn } from "@/lib/utils";

const accent = accents.blue;

const phases = ["question", "retrieving", "answered"] as const;
type Phase = (typeof phases)[number];

const HOLD_MS: Record<Phase, number> = {
  question: 900,
  retrieving: 1400,
  answered: 2600,
};

export function GroundedChat() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const phase = reduced ? "answered" : phases[index];

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % phases.length),
      HOLD_MS[phases[index]],
    );
    return () => clearTimeout(timer);
  }, [index, reduced]);

  const showQuestion = phase !== undefined;
  const showRetrieving = phase === "retrieving" || phase === "answered";
  const showAnswer = phase === "answered";

  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2 sm:max-w-[17rem]">
      <AnimatePresence>
        {showQuestion && (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="ml-auto max-w-[85%] rounded-lg rounded-br-sm border bg-muted/60 px-2.5 py-1.5 text-[11px] leading-relaxed"
            exit={{ opacity: 0 }}
            initial={reduced ? false : { opacity: 0, y: 4 }}
          >
            Do you ship to Germany?
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRetrieving && (
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-max items-center gap-1.5 rounded-md border px-1.5 py-1 font-mono text-[10px]",
              accent.tint,
              accent.border,
              accent.text,
            )}
            exit={{ opacity: 0 }}
            initial={reduced ? false : { opacity: 0, y: 4 }}
          >
            <FileTextIcon className="size-2.5 shrink-0" />
            shipping-policy.pdf
            {!reduced && phase === "retrieving" && (
              <span className="flex gap-0.5">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    className={cn("block size-1 rounded-full", accent.fill)}
                    key={dot}
                    transition={{
                      duration: 0.9,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: dot * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnswer && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-w-[90%] items-start gap-1.5"
            exit={{ opacity: 0 }}
            initial={reduced ? false : { opacity: 0, y: 4 }}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                accent.tint,
                accent.border,
                accent.text,
              )}
            >
              <SparklesIcon className="size-3" />
            </span>
            <p className="rounded-lg rounded-bl-sm border bg-card px-2.5 py-1.5 text-[11px] leading-relaxed shadow-xs">
              Yes, DHL delivers in 3 to 5 business days.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
