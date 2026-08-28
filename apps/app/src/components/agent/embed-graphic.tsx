"use client";

import { motion, useReducedMotion } from "motion/react";
import { MessageCircleIcon } from "lucide-react";

/**
 * The snippet, and the launcher it puts on the page. Kept to those two
 * elements — an abstract mock of the surrounding site added noise without
 * adding meaning.
 */
export function EmbedGraphic() {
  const reduced = useReducedMotion();

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-5">
      <pre className="w-full whitespace-pre-wrap break-all rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[10px] leading-relaxed">
        <code>
          <span className="text-muted-foreground">&lt;script</span> src=
          <span className="text-muted-foreground">&quot;…/widget.js&quot;</span>
          <span className="text-muted-foreground">&gt;&lt;/script&gt;</span>
        </code>
      </pre>

      <span aria-hidden="true" className="h-6 w-px bg-border" />

      <motion.div
        animate={reduced ? undefined : { scale: [0.9, 1, 1, 0.9], opacity: [0, 1, 1, 0] }}
        className="flex size-12 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow"
        transition={
          reduced
            ? undefined
            : {
                duration: 4,
                times: [0, 0.2, 0.85, 1],
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
              }
        }
      >
        <MessageCircleIcon className="size-5" />
      </motion.div>

      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        Live on every page
      </p>
    </div>
  );
}
