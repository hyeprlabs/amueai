"use client";

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/supabase";

type SourceRow = Pick<
  Tables<"sources">,
  "id" | "label" | "type" | "status" | "error_message" | "created_at"
>;

/** Live queued/processing/ready/failed status via Supabase Realtime. */
export function SourcesList({
  agentId,
  initialSources,
}: {
  agentId: string;
  initialSources: SourceRow[];
}) {
  const supabase = useSupabaseClient();
  const [sources, setSources] = useState(initialSources);

  useEffect(() => {
    const channel = supabase
      .channel(`sources:${agentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sources", filter: `agent_id=eq.${agentId}` },
        (payload) => {
          setSources((current) => {
            if (payload.eventType === "DELETE") {
              return current.filter((source) => source.id !== payload.old.id);
            }

            const updated = payload.new as SourceRow;
            const exists = current.some((source) => source.id === updated.id);

            return exists
              ? current.map((source) => (source.id === updated.id ? updated : source))
              : [updated, ...current];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentId]);

  const [pendingId, setPendingId] = useState<string | null>(null);

  async function retrain(sourceId: string) {
    setPendingId(sourceId);
    setSources((current) =>
      current.map((s) => (s.id === sourceId ? { ...s, status: "processing" } : s)),
    );
    try {
      const res = await fetch(`/api/agents/${agentId}/sources/${sourceId}/retrain`, {
        method: "POST",
      });
      if (!res.ok) {
        // Request never kicked off a retrain, so the optimistic
        // "processing" status is never going to resolve on its own.
        setSources((current) =>
          current.map((s) => (s.id === sourceId ? { ...s, status: "failed" } : s)),
        );
      }
    } finally {
      setPendingId(null);
    }
  }

  async function remove(sourceId: string) {
    setPendingId(sourceId);
    try {
      const res = await fetch(`/api/agents/${agentId}/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSources((current) => current.filter((s) => s.id !== sourceId));
      }
    } finally {
      setPendingId(null);
    }
  }

  if (sources.length === 0) return null;

  return (
    <ul className="divide-y rounded-lg border">
      {sources.map((source) => (
        <li key={source.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{source.label}</p>
            {source.status === "failed" && source.error_message && (
              <p className="truncate text-xs text-destructive">{source.error_message}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs text-muted-foreground capitalize">{source.status}</span>
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={pendingId === source.id}
              onClick={() => retrain(source.id)}
            >
              Retrain
            </Button>
            <Button
              type="button"
              size="xs"
              variant="destructive"
              disabled={pendingId === source.id}
              onClick={() => remove(source.id)}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
