import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/**
 * The one empty/placeholder state every dashboard surface uses - a section
 * with nothing in it yet, a feature that isn't built out, or a query that
 * failed. Before this, each page hand-assembled the same Empty parts with
 * its own wrapper classes (`min-h-96 border`, `border border-dashed py-8`,
 * `max-w-md border border-dashed`, ...), so no two placeholders lined up.
 * Everything goes through here now; only `className` escapes for the rare
 * layout tweak (e.g. the full-screen onboarding page).
 */
export function DashboardEmpty({
  icon,
  title,
  description,
  children,
  variant = "default",
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  /** Optional action(s) - a button, a Clerk switcher - rendered under the copy. */
  children?: ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}) {
  const isDestructive = variant === "destructive";

  return (
    <Empty
      className={cn(
        "min-h-80 border border-dashed",
        isDestructive && "border-destructive/30 bg-destructive/5",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia
          className={cn(isDestructive && "bg-destructive/10 text-destructive")}
          variant="icon"
        >
          {icon}
        </EmptyMedia>
        <EmptyTitle className={cn(isDestructive && "text-destructive")}>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}
