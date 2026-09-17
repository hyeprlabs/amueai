import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { CircleArrowUpIcon } from "lucide-react";

const productUsage = {
  label: "Messages",
  used: 0,
  limit: 50,
  resetLabel: "Resets in 12 days",
} as const;

export function ProductUsage() {
  const percentage = (productUsage.used / productUsage.limit) * 100;

  return (
    <div
      className={cn(
        "relative flex min-w-(--sidebar-width) min-h-27 flex-col gap-2 border-t px-4 py-3 *:text-nowrap",
        "transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
      )}
    >
      <Progress className="gap-2" value={percentage}>
        <ProgressLabel className="font-medium text-xs">{productUsage.label}</ProgressLabel>
        <span className="ml-auto text-muted-foreground text-xs tabular-nums font-light">
          {productUsage.used} / {productUsage.limit}
        </span>
      </Progress>
      <p className="text-[10px] text-muted-foreground">{productUsage.resetLabel}</p>
      <Button className="w-full" size="sm" variant="outline">
        <CircleArrowUpIcon />
        Start free trial
      </Button>
    </div>
  );
}
