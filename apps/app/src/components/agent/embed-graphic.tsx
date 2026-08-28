"use client";

import { motion, useReducedMotion } from "motion/react";
import { MessageCircleIcon } from "lucide-react";

import { accents } from "@/components/agent/accent";
import { cn } from "@/lib/utils";

/**
 * The snippet, syntax-coloured, and the launcher it drops onto the page. A
 * caret runs along the code as if it were being pasted, then the bubble pops in.
 */
export function EmbedGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-4 sm:max-w-[17rem]">
      <div className="relative w-full overflow-hidden rounded-lg border bg-card px-2.5 py-2 shadow-xs">
        <pre className="whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed">
          <code>
            <span className={accents.violet.text}>&lt;script</span>{" "}
            <span className={accents.blue.text}>src</span>=
            <span className={accents.emerald.text}>&quot;…/widget.js&quot;</span>
            <span className={accents.violet.text}>&gt;&lt;/script&gt;</span>
          </code>
        </pre>

        {/* Sweep, reading as the snippet being pasted in. */}
        {!reduced && (
          <motion.span
            animate={{ x: ["-30%", "130%"] }}
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-foreground/10 to-transparent"
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        )}
      </div>

      <span aria-hidden="true" className="h-4 w-px bg-border" />

      <div className="relative flex size-12 items-center justify-center">
        {!reduced && (
          <motion.span
            animate={{ scale: [0.8, 1.6], opacity: [0.5, 0] }}
            className="absolute inset-0 rounded-full border border-blue-500/50"
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 2,
              ease: "easeOut",
            }}
          />
        )}
        <motion.span
          animate={reduced ? undefined : { scale: [0.85, 1, 1, 1] }}
          className={cn(
            "flex size-11 items-center justify-center rounded-full text-white shadow-lg",
            accents.blue.fill,
          )}
          transition={
            reduced
              ? undefined
              : {
                  duration: 4,
                  times: [0, 0.15, 0.9, 1],
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "backOut",
                }
          }
        >
          <MessageCircleIcon className="size-5" />
        </motion.span>
      </div>
    </div>
  );
}
