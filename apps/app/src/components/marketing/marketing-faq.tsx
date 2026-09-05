"use client";

import { motion, useReducedMotion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type MarketingFaqItem = {
  id?: string | null;
  question: string;
  answer: string;
};

/**
 * Optional FAQ block rendered below an article's content — shared by blog posts
 * and competitor comparisons. Both publish the same questions as FAQ
 * structured data, so the copy on the page and in the markup never diverge.
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
  const reduced = useReducedMotion();

  if (items.length === 0) return null;

  return (
    <section className="mb-12 border-y lg:mb-24">
      <div className="space-y-2 p-4">
        <h2 className="font-semibold text-xl tracking-tight sm:text-2xl">
          {title || "Frequently Asked Questions"}
        </h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      <Accordion className="rounded-none border-x-0 border-t border-b-0">
        {items.map((item, index) => (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            key={item.id ?? index}
            transition={{ duration: 0.4, delay: reduced ? 0 : index * 0.05, ease: "easeOut" }}
            viewport={{ once: true, margin: "-40px" }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <AccordionItem className="px-4" value={item.id ?? index}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </section>
  );
}
