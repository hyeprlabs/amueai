import { FullWidthDivider } from "@/components/marketing/full-width-divider";
import { cn } from "@/lib/utils";

/**
 * Column count has to be one of these literal classes, not a template
 * string: Tailwind's build only picks up class names it can see verbatim in
 * source, so `sm:grid-cols-${n}` would compile to nothing.
 */
const columnsForCount: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

/** The framed stat row directly under a feature page's hero. */
export function StatStrip({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="relative mb-12 lg:mb-24">
      <FullWidthDivider className="-top-px" />
      <dl className={cn("grid grid-cols-2 gap-px bg-border", columnsForCount[stats.length])}>
        {stats.map((stat) => (
          <div className="bg-background px-3 py-6 text-center" key={stat.label}>
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block font-medium text-2xl md:text-3xl">{stat.value}</span>
              <span aria-hidden="true" className="mt-1 block text-muted-foreground text-xs">
                {stat.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <FullWidthDivider className="-bottom-px" />
    </div>
  );
}
