import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";

/**
 * One cell of the agent feature grid: illustration on top, copy underneath.
 *
 * The illustration sits in a fixed-height stage so cells in the same row line
 * their captions up no matter how tall each graphic is. The faint grid behind
 * the stage is the same treatment the home page's own `FeatureCard` uses, so
 * this grid reads as part of the same system rather than a one-off.
 */
export function AgentFeatureCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  /** Column spans for this cell in the bento grid. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col bg-background", className)}>
      <div className="relative flex h-48 items-center justify-center overflow-hidden p-4 sm:h-56 sm:p-6">
        <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
          <GridPattern
            className="absolute inset-0 size-full stroke-foreground/15 opacity-80"
            height={40}
            width={40}
            x={20}
          />
        </div>
        <div className="relative z-10 flex items-center justify-center">{children}</div>
      </div>
      <div className="border-t p-4 sm:p-6">
        <h3 className="text-balance font-medium text-sm md:text-base">{title}</h3>
        <p className="mt-2 text-balance font-light text-muted-foreground text-xs md:text-sm">
          {description}
        </p>
      </div>
    </section>
  );
}
