"use client";

import { motion, useReducedMotion } from "motion/react";
import { BotIcon, FileTextIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Turn = {
  role: "user" | "agent";
  text: string;
  /** Shown under an agent reply as the source the answer came from. */
  cite?: string;
  /** Marks the reply where the agent declines rather than guesses. */
  refusal?: boolean;
};

const turns: Turn[] = [
  { role: "user", text: "Do you ship to Germany?" },
  { role: "agent", text: "Yes — DHL, 3–5 business days.", cite: "shipping-policy.pdf" },
  { role: "user", text: "What's the CEO's home address?" },
  { role: "agent", text: "I don't have that. Want me to get the team?", refusal: true },
];

/** Seconds between turns, and how long the whole loop runs before repeating. */
const STEP = 1.4;
const LOOP = turns.length * STEP + 2.6;

/**
 * A replaying widget transcript: the agent cites a real source on the first
 * question and declines the second. The loop restarts so the refusal — the
 * point of the section — is never missed by a late scroller.
 *
 * Honours `prefers-reduced-motion` by rendering the finished transcript.
 */
export function GroundedChat() {
  const reduced = useReducedMotion();

  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <span className="flex size-6 items-center justify-center rounded-full border bg-background">
            <BotIcon className="size-3.5" />
          </span>
          <span className="font-medium text-xs">Support agent</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Online</span>
          </span>
        </div>

        <div className="flex flex-col gap-2.5 p-3">
          {turns.map((turn, index) => (
            <motion.div
              animate={
                reduced ? { opacity: 1, y: 0 } : { opacity: [0, 0, 1, 1, 1], y: [6, 6, 0, 0, 0] }
              }
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
                      duration: LOOP,
                      repeat: Number.POSITIVE_INFINITY,
                      times: normalisedTimes(index),
                      ease: "easeOut",
                    }
              }
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg border px-2.5 py-1.5 text-xs leading-relaxed",
                  turn.role === "user"
                    ? "rounded-br-sm bg-muted/60"
                    : "rounded-bl-sm bg-background shadow-xs",
                  turn.refusal && "border-dashed",
                )}
              >
                {turn.text}
              </div>

              {turn.cite && (
                <span className="flex items-center gap-1 rounded-[3px] border border-dashed px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                  <FileTextIcon className="size-2.5" />
                  {turn.cite}
                </span>
              )}

              {turn.refusal && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  not in your sources
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Keyframe offsets that hold a turn hidden until its slot, fade it in, then
 * hold it visible for the rest of the loop. Expressed as fractions of `LOOP`
 * because `times` is normalised, not absolute.
 */
function normalisedTimes(index: number): number[] {
  const start = (index * STEP) / LOOP;
  const end = (index * STEP + 0.45) / LOOP;

  return [0, start, end, 0.94, 1];
}
