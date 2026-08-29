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
  if (items.length === 0) return null;

  return (
    <section className="mb-12 border-y lg:mb-24">
      <div className="space-y-2 p-4">
        <h2 className="font-semibold text-xl tracking-tight sm:text-2xl">
          {title || "Frequently asked questions"}
        </h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      <Accordion className="rounded-none border-x-0 border-t border-b-0">
        {items.map((item, index) => (
          <AccordionItem className="px-4" key={item.id ?? index} value={item.id ?? index}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
