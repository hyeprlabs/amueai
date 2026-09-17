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
