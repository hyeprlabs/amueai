import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * The hero every secondary marketing page opens with, so the badge, `h1` and
 * lead paragraph stay identical across them. Type scale and the faded side
 * rules match the home page's `HeroSection`.
 */
export function PageHero({
  badge,
  title,
  description,
  align = "start",
  children,
}: {
  badge: string;
  title: React.ReactNode;
  description: React.ReactNode;
  /** `center` for the product pages, `start` for the document-style pages. */
  align?: "start" | "center";
  /** Call-to-action buttons, rendered under the lead paragraph. */
  children?: React.ReactNode;
}) {
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative flex flex-col gap-5 px-4 py-12 md:py-24 lg:py-28",
        centered ? "items-center text-center" : "items-start",
      )}
    >
      {/* X Faded Borders, matching the home hero. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 size-full overflow-hidden">
        <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
        <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
        <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
        <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
      </div>

      <Badge
        className={cn("rounded-md", "fade-in animate-in fill-mode-backwards duration-500 ease-out")}
        variant="outline"
      >
        {badge}
      </Badge>

      <h1
        className={cn(
          "max-w-2xl text-balance font-medium text-3xl text-foreground md:text-5xl lg:text-6xl",
          "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out",
        )}
      >
        {title}
      </h1>

      <p
        className={cn(
          "max-w-xl text-balance text-muted-foreground text-sm sm:text-lg",
          "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out",
        )}
      >
        {description}
      </p>

      {children && (
        <div
          className={cn(
            "fade-in slide-in-from-bottom-10 flex w-full animate-in flex-col gap-2 fill-mode-backwards pt-2 delay-300 duration-500 ease-out sm:w-auto sm:flex-row",
            centered && "items-center",
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
