"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type MarketingFaqItem = {
  id?: string | null;
  question: string;
  answer: string;
};

/**
 * Optional FAQ block rendered below an article's content — shared by blog posts
 * and competitor comparisons. Both publish the same questions as FAQ
 * structured data, so the copy on the page and in the markup never diverge.
 *
 * A self-contained disclosure rather than the shared `Accordion` primitive:
 * only the collapsing/expanding panel animates (via the `motion` package),
 * so each item opens and closes independently.
 */
export function MarketingFaq({
  title,
  description,
  items,
}: {
  title?: string | null;
  description?: string | null;
  items: MarketingFaqItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-12 border-y lg:mb-24">
      <div className="space-y-2 p-4">
        <h2 className="font-semibold text-xl tracking-tight sm:text-2xl">
          {title || "Frequently Asked Questions"}
        </h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      <div className="divide-y border-t">
        {items.map((item, index) => (
          <FaqRow item={item} key={item.id ?? index} />
        ))}
      </div>
    </section>
  );
}

function FaqRow({ item }: { item: MarketingFaqItem }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="px-4">
      <h3>
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className="flex w-full flex-1 items-center justify-between gap-4 py-4 text-left font-medium text-sm outline-none hover:no-underline focus-visible:underline sm:text-base"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {item.question}
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate="open"
            className="overflow-hidden text-sm"
            exit="collapsed"
            id={panelId}
            initial="collapsed"
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            variants={{ open: { height: "auto" }, collapsed: { height: 0 } }}
          >
            {/*
              Height and opacity animate on separate layers: fading the
              outer element while it resizes makes the text visibly squash,
              so only this inner layer fades/slides, slightly faster than
              the height tween settles.
            */}
            <motion.div
              className="pb-4 text-muted-foreground"
              transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
              variants={{ open: { opacity: 1, y: 0 }, collapsed: { opacity: 0, y: -4 } }}
            >
              {item.answer}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
