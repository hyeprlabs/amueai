"use client";

// Local stand-in for AI Elements' <PromptInput> family — see
// conversation.tsx for why.
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SendIcon } from "lucide-react";

export function PromptInput({ className, onSubmit, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex items-end gap-2 border-t p-3", className)}
      {...props}
    />
  );
}

export function PromptInputTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      className={cn("min-h-10 flex-1 resize-none", className)}
      rows={1}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }}
      {...props}
    />
  );
}

export function PromptInputSubmit({
  disabled,
  status,
}: {
  disabled?: boolean;
  status?: "submitted" | "streaming" | "ready" | "error";
}) {
  return (
    <Button type="submit" size="icon" disabled={disabled || status === "streaming"}>
      <SendIcon />
    </Button>
  );
}
