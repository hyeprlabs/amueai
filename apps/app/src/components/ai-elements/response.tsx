// Local stand-in for AI Elements' <Response> — see conversation.tsx for
// why. The real component renders streaming markdown via `streamdown`;
// this stand-in only preserves whitespace/line breaks, so answers with
// markdown formatting (lists, code blocks) will render as plain text
// until the real component replaces this.
import { cn } from "@/lib/utils";

export function Response({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("whitespace-pre-wrap text-sm leading-relaxed", className)} {...props}>
      {children}
    </div>
  );
}
