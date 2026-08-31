"use client";

import { CircleCheckIcon, CircleXIcon, ClockIcon, Loader2Icon } from "lucide-react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ingestSource } from "@/trigger/ingest-source";

/**
 * Live queued/processing/ready/failed badge for one source, driven directly
 * by its Trigger.dev run via `useRealtimeRun` - the pattern Trigger.dev's
 * own docs recommend for showing run progress in a UI, and independent of
 * Supabase Realtime (so it keeps working even if that channel is slow to
 * pick up the row's status column changes). Only mounted for a source with
 * an active run (see SourcesPanel); once the run settles, `onSettled` lets
 * the caller drop back to the row's plain DB-driven status.
 */
export function LiveSourceStatus({
  runId,
  accessToken,
  onSettled,
}: {
  runId: string;
  accessToken: string;
  onSettled: () => void;
}) {
  const { run } = useRealtimeRun<typeof ingestSource>(runId, {
    accessToken,
    skipColumns: ["payload", "output"],
    onComplete: onSettled,
  });

  if (run?.isSuccess) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleCheckIcon className="text-emerald-600 dark:text-emerald-500" />
        Ready
      </Badge>
    );
  }

  if (run?.isFailed || run?.isCancelled) {
    const badge = (
      <Badge variant="destructive" className="gap-1">
        <CircleXIcon />
        Failed
      </Badge>
    );
    if (!run.error?.message) return badge;
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
          {badge}
        </TooltipTrigger>
        <TooltipContent>{run.error.message}</TooltipContent>
      </Tooltip>
    );
  }

  if (run?.isExecuting || run?.isWaiting) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2Icon className="animate-spin" />
        Processing
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <ClockIcon />
      Queued
    </Badge>
  );
}
