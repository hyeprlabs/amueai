"use client";

// Local stand-in for AI Elements' <Conversation> — `npx ai-elements@latest add`
// fetches component source from elements.ai-sdk.dev, which this sandbox's
// network policy blocks. Re-run the real CLI once that domain is reachable
// and this file can go away. Mirrors the upstream API surface
// (Conversation/ConversationContent/ConversationScrollButton) closely
// enough that swapping it back out later shouldn't touch call sites.
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function Conversation({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("relative flex-1 overflow-y-auto", className)} {...props}>
      {children}
    </div>
  );
}

export function ConversationContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  });

  return (
    <div className={cn("flex flex-col gap-4 p-4", className)} {...props}>
      {children}
      <div ref={ref} />
    </div>
  );
}
