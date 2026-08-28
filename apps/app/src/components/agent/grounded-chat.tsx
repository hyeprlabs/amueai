"use client";

import { motion, useReducedMotion } from "motion/react";
import { FileTextIcon, SparklesIcon } from "lucide-react";

import { accents } from "@/components/agent/accent";
import { cn } from "@/lib/utils";

/** One full replay: question, agent thinking, cited answer, hold, restart. */
const LOOP = 6;
const at = (seconds: number) => seconds / LOOP;

export function GroundedChat() {
  const reduced = useReducedMotion();

  /** Fades a step in at `start` and holds it until the loop restarts. */
  const step = (start: number) =>
    reduced
      ? { animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          animate: { opacity: [0, 0, 1, 1, 0], y: [4, 4, 0, 0, 0] },
          transition: {
            duration: LOOP,
            times: [0, at(start), at(start + 0.35), 0.94, 1],
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut" as const,
          },
        };

  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2 sm:max-w-[17rem]">
      {/* Visitor question */}
      <motion.p
        className="ml-auto max-w-[85%] rounded-lg rounded-br-sm border bg-muted/60 px-2.5 py-1.5 text-[11px] leading-relaxed"
        initial={false}
        {...step(0.2)}
      >
        Do you ship to Germany?
      </motion.p>

      {/* Retrieval step: the agent is reading a source, and says which one. */}
      <motion.span
        className={cn(
          "flex w-max items-center gap-1.5 rounded-md border px-1.5 py-1 font-mono text-[10px]",
          accents.blue.tint,
          accents.blue.border,
          accents.blue.text,
        )}
        initial={false}
        {...step(1.1)}
      >
        <FileTextIcon className="size-2.5 shrink-0" />
        shipping-policy.pdf
        {!reduced && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map((dot) => (
              <motion.span
                animate={{ opacity: [0.25, 1, 0.25] }}
                className={cn("block size-1 rounded-full", accents.blue.fill)}
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

      {/* Grounded answer */}
      <motion.div className="flex max-w-[90%] items-start gap-1.5" initial={false} {...step(2.2)}>
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
            accents.violet.tint,
            accents.violet.border,
            accents.violet.text,
          )}
        >
          <SparklesIcon className="size-3" />
        </span>
        <p className="rounded-lg rounded-bl-sm border bg-card px-2.5 py-1.5 text-[11px] leading-relaxed shadow-xs">
          Yes, DHL delivers in 3 to 5 business days.
        </p>
      </motion.div>
    </div>
  );
}
