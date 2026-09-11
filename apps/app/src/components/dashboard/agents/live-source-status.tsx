"use client";

import { useEffect, useRef } from "react";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";

import { SourceStatusBadge } from "@/components/dashboard/agents/source-status-badge";

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

  const completed = runs.filter((run) => run.isCompleted).length;
  const settled = runs.length > 0 && completed === runs.length;
  const failed = runs.find((run) => run.isFailed || run.isCancelled);

  const notified = useRef(false);
  useEffect(() => {
    if (!settled || notified.current) return;
    notified.current = true;
    onSettled();
  }, [settled, onSettled]);

  if (!settled) {
    return (
      <SourceStatusBadge
        label={runs.length > 1 ? `${completed}/${runs.length} pages processed` : undefined}
        status={runs.length === 0 ? "queued" : "processing"}
      />
    );
  }

  return <SourceStatusBadge error={failed?.error?.message} status={failed ? "failed" : "ready"} />;
}
