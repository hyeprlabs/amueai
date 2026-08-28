import { cn } from "@/lib/utils";

/**
 * One "copy beside illustration" band.
 *
 * Its heading is an `h2` because each band is its own top-level section of the
 * page, sitting directly under the `h1`. Stacks to a single column below `md`,
 * where the illustration always follows the copy regardless of `reverse` —
 * reading order beats visual rhythm on a phone.
 */
export function FeatureRow({
  icon,
  title,
  description,
  reverse = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Put the illustration on the left at `md` and up. */
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
      <div
        className={cn(
          "flex flex-col justify-center bg-background p-6 md:p-8",
          reverse && "md:order-2",
        )}
      >
        <div aria-hidden="true" className="[&_svg]:size-6 [&_svg]:text-foreground/75">
          {icon}
        </div>
        <h2 className="mt-6 text-balance font-medium text-lg md:text-xl">{title}</h2>
        <p className="mt-2 text-balance font-light text-muted-foreground text-sm">{description}</p>
      </div>

      <div
        className={cn(
          "flex items-center justify-center bg-background p-6 md:p-8",
          "dark:bg-[radial-gradient(60%_80%_at_50%_0%,--theme(--color-foreground/.07),transparent)]",
          reverse && "md:order-1",
        )}
      >
        {children}
      </div>
    </section>
  );
}
