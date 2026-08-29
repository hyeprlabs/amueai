"use client";

import type { UIMessage } from "ai";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type MessageProps = React.HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export function Message({ from, className, children, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        "group flex w-full items-end justify-end gap-2 py-2",
        from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type MessageContentProps = React.HTMLAttributes<HTMLDivElement>;

export function MessageContent({ className, children, ...props }: MessageContentProps) {
  return (
    <div
      className={cn(
        "flex max-w-[80%] flex-col gap-2 rounded-lg text-sm text-foreground",
        "group-[.is-assistant]:max-w-full group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-foreground",
        "group-[.is-user]:bg-primary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type MessageResponseProps = React.ComponentProps<typeof Streamdown>;

export function MessageResponse({ className, ...props }: MessageResponseProps) {
  return (
    <Streamdown
      className={cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      {...props}
    />
  );
}

export function MessageActions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
}

export type MessageActionProps = React.ComponentProps<typeof Button> & {
  tooltip?: string;
  label: string;
};

export function MessageAction({
  tooltip,
  label,
  children,
  className,
  ...props
}: MessageActionProps) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn("size-7 text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      {children}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
