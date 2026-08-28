import { FullWidthDivider } from "@/components/full-width-divider";
import { SectionHeading } from "@/components/marketing/page-hero";

/**
 * The label-only capability strip that closes out a feature page, after the
 * illustrated bands have already made the argument in more depth. Shared by
 * the Agent and Channels pages so both close on the same shaped section.
 */
export function CapabilityStrip({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: { label: string; icon: React.ReactNode }[];
}) {
  return (
    <section className="mb-12 lg:mb-24">
      <SectionHeading description={description} title={title} />

      <div className="relative dark:bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.08),transparent)]">
        <FullWidthDivider className="-top-px" />
        <ul className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li
              className="flex items-center gap-2.5 bg-background p-4 md:p-6 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-foreground/75"
              key={item.label}
            >
              {item.icon}
              <span className="text-balance text-xs md:text-sm">{item.label}</span>
            </li>
          ))}
        </ul>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
