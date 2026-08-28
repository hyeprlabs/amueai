"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCheckIcon, CheckIcon } from "lucide-react";

import { accents } from "./accent";
import { cn } from "@/lib/utils";

const accent = accents.emerald;

/** Sent, delivered, then read, looping. Driven by a stepped index like the
 * agent illustrations, not a shared timeline, so each state is unambiguous. */
const phases = ["sent", "delivered", "read"] as const;
const HOLD_MS = 1100;

export function WhatsAppGraphic() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const phase = reduced ? "read" : phases[index];

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % phases.length), HOLD_MS);
    return () => clearTimeout(timer);
  }, [index, reduced]);

  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-2 sm:max-w-[17rem]">
      <p className="ml-auto max-w-[85%] rounded-lg rounded-br-sm border bg-muted/60 px-2.5 py-1.5 text-[11px] leading-relaxed">
        Is my order still on the way?
      </p>

      <div className="flex items-end gap-1.5">
        <p
          className={cn(
            "max-w-[85%] rounded-lg rounded-bl-sm border px-2.5 py-1.5 text-[11px] leading-relaxed shadow-xs",
            accent.tint,
            accent.border,
          )}
        >
          Yes, out for delivery today.
        </p>
        <span className={cn("mb-0.5 flex shrink-0 items-center", accent.text)}>
          {phase === "sent" ? (
            <CheckIcon className="size-3" />
          ) : (
            <motion.span
              animate={{ opacity: 1 }}
              className={cn(phase === "read" ? accent.text : "text-muted-foreground")}
              initial={reduced ? false : { opacity: 0 }}
            >
              <CheckCheckIcon className="size-3" />
            </motion.span>
          )}
        </span>
      </div>

      <span className="ml-auto font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {phase}
      </span>
    </div>
  );
}
