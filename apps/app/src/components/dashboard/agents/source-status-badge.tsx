import { CircleCheckIcon, CircleXIcon, ClockIcon, Loader2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SourceStatus = "queued" | "crawling" | "processing" | "ready" | "failed";

const config = {
  queued: { label: "Queued", variant: "secondary", icon: <ClockIcon /> },
  crawling: {
    label: "Crawling",
    variant: "outline",
    icon: <Loader2Icon className="animate-spin" />,
  },
  processing: {
    label: "Processing",
    variant: "outline",
    icon: <Loader2Icon className="animate-spin" />,
  },
  ready: {
    label: "Ready",
    variant: "secondary",
    icon: <CircleCheckIcon className="text-emerald-600 dark:text-emerald-500" />,
  },
  failed: { label: "Failed", variant: "destructive", icon: <CircleXIcon /> },
} satisfies Record<
  SourceStatus,
  { label: string; variant: "secondary" | "outline" | "destructive"; icon: React.ReactNode }
>;

export function SourceStatusBadge({
  status,
  label,
  error,
}: {
  status: SourceStatus;
  label?: string;
  error?: string | null;
}) {
  const { icon, variant, label: defaultLabel } = config[status];
  const badge = (
    <Badge className="gap-1" variant={variant}>
      {icon}
      {label ?? defaultLabel}
    </Badge>
  );

  if (!error) return badge;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
        {badge}
      </TooltipTrigger>
      <TooltipContent>{error}</TooltipContent>
    </Tooltip>
  );
}
