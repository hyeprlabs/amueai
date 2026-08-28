"use client";

import { motion, useReducedMotion } from "motion/react";

import { accents } from "./accent";
import { cn } from "@/lib/utils";

/** Answered vs unanswered, per day. The gap is the point: it shrinks. */
const days = [
  { answered: 0.45, gap: 0.3 },
  { answered: 0.6, gap: 0.24 },
  { answered: 0.52, gap: 0.18 },
  { answered: 0.74, gap: 0.14 },
  { answered: 0.68, gap: 0.1 },
  { answered: 0.88, gap: 0.07 },
  { answered: 1, gap: 0.04 },
];

export function ConversationsGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-[15rem] flex-col gap-3 sm:max-w-[17rem]">
      {/*
        Columns stretch to the track's full height (no `items-end`), so the
        percentage bar heights below have something to resolve against;
        `justify-end` is what seats the bars on the baseline.
      */}
      {/*
        Columns stretch to the track's full height (no `items-end`), so the
        percentage bar heights below have something to resolve against.

        The whole column is what animates, not each segment: `scaleY` moves
        paint but not layout, so scaling the two bars independently would let
        the stacked pair drift apart mid-grow.
      */}
      <div className="flex h-24 gap-1.5">
        {days.map((day, index) => (
          <motion.div
            animate={reduced ? { scaleY: 1 } : { scaleY: [0, 1] }}
            className="flex h-full flex-1 origin-bottom flex-col justify-end gap-0.5"
            key={index}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    duration: 1.2,
                    delay: index * 0.08,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 2.6,
                    ease: "easeOut",
                  }
            }
          >
            <span
              className={cn("block w-full rounded-t-[3px]", accents.rose.fill)}
              style={{ height: `${day.gap * 100}%` }}
            />
            <span
              className={cn("block w-full rounded-t-[3px]", accents.emerald.fill)}
              style={{ height: `${day.answered * 100}%` }}
            />
          </motion.div>
        ))}
      </div>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", accents.emerald.fill)} />
          Answered
        </li>
        <li className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", accents.rose.fill)} />
          Gaps to fill
        </li>
      </ul>
    </div>
  );
}
