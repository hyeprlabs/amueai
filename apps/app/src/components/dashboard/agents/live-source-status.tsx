"use client";

import { useEffect, useRef } from "react";
import { CircleCheckIcon, CircleXIcon, ClockIcon, Loader2Icon } from "lucide-react";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Live queued/processing/ready/failed badge for one source, driven by every
 * Trigger.dev run tagged `source:{id}` - the pattern Trigger.dev's own docs
 * recommend for showing run progress in a UI, and independent of Supabase
 * Realtime (so it keeps working even if that channel is slow to pick up the
 * row's status column changes). Tag-based rather than a single run id: a
 * url source's full-site crawl fans out into many child-page processing
 * runs that all carry this tag, so this same component and subscription
 * covers both "one doc" and "dozens of pages" without special-casing.
 *
 * Only mounted for a source with an active run (see SourcesPanel); once
 * every tagged run has settled, `onSettled` lets the caller drop back to
 * the row's plain DB-driven status.
 */
export function LiveSourceStatus({
  sourceId,
  accessToken,
  onSettled,
}: {
  sourceId: string;
  accessToken: string;
  onSettled: () => void;
}) {
  const { runs } = useRealtimeRunsWithTag(`source:${sourceId}`, {
    accessToken,
    skipColumns: ["payload", "output"],
  });

  const total = runs.length;
  const completed = runs.filter((run) => run.isCompleted).length;
  const failed = runs.some((run) => run.isFailed || run.isCancelled);
  const allSettled = total > 0 && completed === total;

  const settledRef = useRef(false);
  useEffect(() => {
    if (allSettled && !settledRef.current) {
      settledRef.current = true;
      onSettled();
    }
  }, [allSettled, onSettled]);

  if (allSettled && failed) {
    const failingRun = runs.find((run) => run.isFailed || run.isCancelled);
    const badge = (
      <Badge variant="destructive" className="gap-1">
        <CircleXIcon />
        Failed
      </Badge>
    );
    if (!failingRun?.error?.message) return badge;
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
          {badge}
        </TooltipTrigger>
        <TooltipContent>{failingRun.error.message}</TooltipContent>
      </Tooltip>
    );
  }

  if (allSettled) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleCheckIcon className="text-emerald-600 dark:text-emerald-500" />
        Ready
      </Badge>
    );
  }

  if (total > 1) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2Icon className="animate-spin" />
        {completed}/{total} pages processed
      </Badge>
    );
  }

  if (total === 1) {
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
