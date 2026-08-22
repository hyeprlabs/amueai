import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type BlogFaqItem = {
  id?: string | null;
  question: string;
  answer: string;
};

/** Optional per-post FAQ, rendered below the article content when enabled in Payload. */
export function BlogFaq({
  title,
  description,
  items,
}: {
  title?: string | null;
  description?: string | null;
  items: BlogFaqItem[];
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

      <Accordion className="rounded-none border-x-0 border-y">
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
