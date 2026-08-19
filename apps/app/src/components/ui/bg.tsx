import { cn } from "@/lib/utils";

export const Background = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn(
      "-z-20 pointer-events-none absolute top-0 left-1/2 h-screen w-screen -translate-x-1/2",
      "bg-[radial-gradient(125%_125%_at_50%_90%,theme(--color-background)_40%,#63e_100%)]",
      className,
    )}
  />
);
