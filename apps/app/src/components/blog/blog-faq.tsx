import { PlusIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

      <div className="divide-y border-t">
        {items.map((item, index) => (
          <Collapsible className="group/faq p-4" key={item.id ?? index}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 text-left font-medium text-sm sm:text-base">
              {item.question}
              <PlusIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/faq:rotate-45"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 text-muted-foreground text-sm leading-relaxed">
              {item.answer}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </section>
  );
}
