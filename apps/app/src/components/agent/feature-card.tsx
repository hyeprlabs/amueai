import { cn } from "@/lib/utils";

/**
 * One cell of the agent feature grid: illustration on top, copy underneath.
 *
 * The illustration sits in a fixed-height stage so cells in the same row line
 * their captions up no matter how tall each graphic is.
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
        {children}
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
