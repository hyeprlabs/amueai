"use client";

import { motion, useReducedMotion } from "motion/react";
import { BotIcon, FileTextIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A short widget transcript that fades in on a loop. Two turns only — the
 * question and the cited answer — so the point lands at a glance.
 */
const turns = [
  { role: "user", text: "Do you ship to Germany?" },
  { role: "agent", text: "Yes — DHL, 3–5 business days.", cite: "shipping-policy.pdf" },
] as const;

export function GroundedChat() {
  const reduced = useReducedMotion();

  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <span className="flex size-6 items-center justify-center rounded-full border bg-background">
          <BotIcon className="size-3.5" />
        </span>
        <span className="font-medium text-xs">Support agent</span>
      </div>

      <div className="flex flex-col gap-2.5 p-3">
        {turns.map((turn, index) => (
          <motion.div
            animate={reduced ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [4, 0, 0, 0] }}
            className={cn(
              "flex flex-col gap-1",
              turn.role === "user" ? "items-end" : "items-start",
            )}
            initial={false}
            key={turn.text}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    times: [0, 0.12 + index * 0.14, 0.9, 1],
                    ease: "easeOut",
                  }
            }
          >
            <p
              className={cn(
                "max-w-[85%] rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed",
                turn.role === "user"
                  ? "rounded-br-sm bg-muted/60"
                  : "rounded-bl-sm bg-background shadow-xs",
              )}
            >
              {turn.text}
            </p>

            {"cite" in turn && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <FileTextIcon className="size-2.5 shrink-0" />
                {turn.cite}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
