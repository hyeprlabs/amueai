"use client";

import { motion, useReducedMotion } from "motion/react";
import { MessageCircleIcon } from "lucide-react";

/**
 * A miniature site with the widget launcher dropping into its corner, above the
 * one-line snippet that puts it there. Sells "paste this, get that" without a
 * screenshot.
 */
export function EmbedGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="relative aspect-16/10 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-2.5 py-2">
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="ml-1.5 h-3 flex-1 rounded-[3px] bg-background" />
        </div>

        {/* Placeholder page furniture, deliberately abstract. */}
        <div className="space-y-2 p-3">
          <div className="h-2 w-1/3 rounded-[3px] bg-muted" />
          <div className="h-2 w-3/4 rounded-[3px] bg-muted/70" />
          <div className="h-2 w-2/3 rounded-[3px] bg-muted/70" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-8 rounded-md bg-muted/60" />
            <div className="h-8 rounded-md bg-muted/60" />
            <div className="h-8 rounded-md bg-muted/60" />
          </div>
        </div>

        <motion.div
          animate={reduced ? undefined : { scale: [0, 1, 1, 1], opacity: [0, 1, 1, 1] }}
          className="absolute right-2.5 bottom-2.5 flex size-9 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow"
          transition={
            reduced
              ? undefined
              : {
                  duration: 4,
                  times: [0, 0.18, 0.9, 1],
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "backOut",
                }
          }
        >
          <MessageCircleIcon className="size-4" />
        </motion.div>
      </div>

      {/* Wraps rather than scrolls: a clipped snippet reads as broken. */}
      <pre className="whitespace-pre-wrap break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[10px] leading-relaxed">
        <code>
          <span className="text-muted-foreground">&lt;script</span> src=
          <span className="text-muted-foreground">&quot;…/widget.js&quot;</span> data-id=
          <span className="text-muted-foreground">&quot;abc123&quot;</span>
          <span className="text-muted-foreground">&gt;&lt;/script&gt;</span>
        </code>
      </pre>
    </div>
  );
}
