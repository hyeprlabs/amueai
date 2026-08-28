"use client";

import { motion, useReducedMotion } from "motion/react";
import { MessageCircleIcon } from "lucide-react";

import { accents } from "./accent";
import { cn } from "@/lib/utils";

const accent = accents.violet;

export function EmbedGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-[15rem] flex-col items-center gap-2 sm:max-w-[17rem] sm:gap-3">
      <div className="relative w-full overflow-hidden rounded-lg border bg-card px-2.5 py-1.5 shadow-xs">
        <pre className="whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed">
          <code>
            <span className="text-muted-foreground">&lt;script src=</span>
            <span className={accent.text}>&quot;…/widget.js&quot;</span>
            <span className="text-muted-foreground">&gt;&lt;/script&gt;</span>
          </code>
        </pre>

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
            className={cn("absolute inset-0 rounded-full border", accent.border)}
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
            accent.fill,
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
