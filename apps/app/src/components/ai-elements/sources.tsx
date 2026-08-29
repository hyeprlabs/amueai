"use client";

import { BookIcon, ChevronDownIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type SourcesProps = React.ComponentProps<typeof Collapsible>;

export function Sources({ className, ...props }: SourcesProps) {
  return (
    <Collapsible
      className={cn("mb-2 flex w-full flex-col gap-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export type SourcesTriggerProps = React.ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export function SourcesTrigger({ count, className, children, ...props }: SourcesTriggerProps) {
  return (
    <CollapsibleTrigger
      className={cn(
        "group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <BookIcon className="size-4" />
          <span>
            Used {count} source{count === 1 ? "" : "s"}
          </span>
          <ChevronDownIcon className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
        </>
      )}
    </CollapsibleTrigger>
  );
}

export type SourcesContentProps = React.ComponentProps<typeof CollapsibleContent>;

export function SourcesContent({ className, ...props }: SourcesContentProps) {
  return (
    <CollapsibleContent className={cn("flex flex-col gap-2 [&>div]:pl-2", className)} {...props} />
  );
}

export type SourceProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function Source({ href, title, className, children, ...props }: SourceProps) {
  return (
    <div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn("flex items-center gap-1.5 text-sm hover:underline", className)}
        {...props}
      >
        {children ?? (
          <>
            <BookIcon className="size-3.5 shrink-0" />
            <span className="truncate">{title ?? href}</span>
          </>
        )}
      </a>
    </div>
  );
}
