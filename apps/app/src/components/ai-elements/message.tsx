// Local stand-in for AI Elements' <Message> — see conversation.tsx for why.
import { cn } from "@/lib/utils";

export function Message({
  from,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { from: "user" | "assistant" }) {
  return (
    <div
      className={cn("flex w-full", from === "user" ? "justify-end" : "justify-start", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function MessageContent({
  from,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { from?: "user" | "assistant" }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
        from === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
