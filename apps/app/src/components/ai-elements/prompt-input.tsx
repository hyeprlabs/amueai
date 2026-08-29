"use client";

import type { ChatStatus } from "ai";
import { ArrowUpIcon, Loader2Icon, SquareIcon, XIcon } from "lucide-react";
import { createContext, useContext, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type PromptInputMessage = {
  text: string;
};

type PromptInputContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

function usePromptInputContext() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("PromptInput components must be used within <PromptInput>");
  }
  return context;
}

export type PromptInputProps = Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onSubmit: (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) => void;
};

export function PromptInput({ className, onSubmit, children, ...props }: PromptInputProps) {
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <PromptInputContext.Provider value={{ value, setValue }}>
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          const text = value.trim();
          if (!text) return;
          onSubmit({ text }, event);
          setValue("");
        }}
        className={cn("flex items-end gap-2 border-t p-3", className)}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

export type PromptInputTextareaProps = React.ComponentProps<typeof Textarea>;

export function PromptInputTextarea({ className, onChange, ...props }: PromptInputTextareaProps) {
  const { value, setValue } = usePromptInputContext();

  return (
    <Textarea
      aria-label="Message"
      className={cn("min-h-10 flex-1 resize-none", className)}
      rows={1}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        onChange?.(event);
      }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
      }}
      {...props}
    />
  );
}

export type PromptInputSubmitProps = React.ComponentProps<typeof Button> & {
  status?: ChatStatus;
};

export function PromptInputSubmit({
  className,
  status,
  disabled,
  ...props
}: PromptInputSubmitProps) {
  let Icon = ArrowUpIcon;
  if (status === "submitted") Icon = Loader2Icon;
  else if (status === "streaming") Icon = SquareIcon;
  else if (status === "error") Icon = XIcon;

  return (
    <Button
      type="submit"
      size="icon"
      aria-label="Send message"
      disabled={disabled || status === "streaming" || status === "submitted"}
      className={cn("shrink-0", className)}
      {...props}
    >
      <Icon className={cn("size-4", status === "submitted" && "animate-spin")} />
    </Button>
  );
}
