import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon-tile";
import { Badge } from "@/components/ui/badge";
import type React from "react";

export type LinkItemType = {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  /** Page isn't built yet — render as a disabled, greyed-out placeholder instead of a link. */
  isComingSoon?: boolean;
};

/** Tiny marker for nav entries whose page isn't live yet. */
export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <Badge
      className={cn("h-4 rounded-md px-1 py-0 font-normal text-[10px] leading-none", className)}
      variant="outline"
    >
      Soon
    </Badge>
  );
}

export function LinkItem({
  label,
  description,
  icon,
  className,
  href,
  isComingSoon,
  ...props
}: React.ComponentProps<"a"> & LinkItemType) {
  if (isComingSoon) {
    return (
      <div
        aria-disabled="true"
        className={cn("flex cursor-not-allowed items-center gap-x-2 opacity-50", className)}
      >
        <IconTile aria-hidden="true" size="default" variant="frame">
          {icon}
        </IconTile>
        <div className="flex flex-col items-start justify-center">
          <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
            {label}
            <ComingSoonBadge />
          </span>
          <span className="line-clamp-2 text-muted-foreground text-xs">{description}</span>
        </div>
      </div>
    );
  }

  return (
    <a className={cn("flex items-center gap-x-2", className)} href={href} {...props}>
      <IconTile aria-hidden="true" size="default" variant="frame">
        {icon}
      </IconTile>
      <div className="flex flex-col items-start justify-center">
        <span className="font-medium">{label}</span>
        <span className="line-clamp-2 text-muted-foreground text-xs">{description}</span>
      </div>
    </a>
  );
}
