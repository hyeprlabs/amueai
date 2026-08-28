import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon-tile";

/**
 * One alternating "copy on one side, illustration on the other" band.
 *
 * Stacks to a single column below `md`, where the illustration always follows
 * the copy regardless of `reverse` — reading order beats visual rhythm on a
 * phone.
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
    <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
      <div
        className={cn(
          "flex flex-col justify-center bg-background p-6 sm:p-8 lg:p-10",
          reverse && "md:order-2",
        )}
      >
        <IconTile size="default" variant="frame">
          {icon}
        </IconTile>
        <h2 className="mt-5 text-balance font-medium text-xl sm:text-2xl md:text-3xl">{title}</h2>
        <p className="mt-3 text-balance text-muted-foreground text-sm sm:text-base">
          {description}
        </p>
      </div>

      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-background p-6 sm:p-8 lg:p-10",
          "dark:bg-[radial-gradient(60%_80%_at_50%_0%,--theme(--color-foreground/.07),transparent)]",
          reverse && "md:order-1",
        )}
      >
        {children}
      </div>
    </div>
  );
}
