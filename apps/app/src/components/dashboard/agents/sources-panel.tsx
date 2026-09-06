"use client";

import { useCallback, useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";
import {
  AddSourceDialog,
  type QueuedSource,
} from "@/components/dashboard/agents/add-source-dialog-drawer";
import {
  SourcesTable,
  type ActiveRun,
  type SourceRow,
} from "@/components/dashboard/agents/sources-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

/**
 * Owns everything the sources tab needs to feel live: the row list (seeded
 * server-side, then kept in sync two ways), the set of sources with an
 * active Trigger.dev run, and the retrain/delete calls.
 *
 * Two update paths, both without a reload:
 * 1. Trigger.dev realtime (LiveSourceStatus, via activeRuns) - immediate,
 *    exact run-lifecycle status for whichever source *this tab* just
 *    queued or retrained. This is the primary mechanism, per Trigger.dev's
 *    own recommended pattern (mint a scoped token, subscribe with
 *    useRealtimeRun) - it doesn't depend on a Postgres change event
 *    reaching this client at all.
 * 2. Supabase Realtime on the `sources` table - a baseline so a second tab,
 *    or a teammate viewing the same agent, also sees status/row changes
 *    live even though they hold no run token for it.
 */
export function SourcesPanel({
  agentId,
  initialSources,
}: {
  agentId: string;
  initialSources: SourceRow[];
}) {
  const supabase = useSupabaseClient();
  const [sources, setSources] = useState(initialSources);
  const [activeRuns, setActiveRuns] = useState<Record<string, ActiveRun>>({});

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

  const clearRun = useCallback((sourceId: string) => {
    setActiveRuns((current) => {
      if (!(sourceId in current)) return current;
      const next = { ...current };
      delete next[sourceId];
      return next;
    });
  }, []);

  const settleRun = useCallback(
    async (sourceId: string) => {
      clearRun(sourceId);

      // The row's own StatusBadge takes over once its run is no longer
      // active - refetch it directly instead of trusting the Supabase
      // Realtime channel got the UPDATE, so the badge can't fall back to a
      // stale pre-run status while waiting on that channel.
      const { data } = await supabase
        .from("sources")
        .select("id, label, status, error_message, created_at")
        .eq("id", sourceId)
        .single();
      if (data) {
        setSources((current) => current.map((s) => (s.id === sourceId ? data : s)));
      }
    },
    [supabase, clearRun],
  );

  function handleQueued({ source, run }: QueuedSource) {
    setSources((current) =>
      current.some((s) => s.id === source.id) ? current : [source, ...current],
    );
    setActiveRuns((current) => ({ ...current, [source.id]: run }));
  }

  async function handleRetrain(sourceId: string) {
    try {
      const res = await fetch(`/api/agents/${agentId}/sources/${sourceId}/retrain`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Couldn't start retraining");

      setActiveRuns((current) => ({
        ...current,
        [sourceId]: { accessToken: body.run.publicAccessToken },
      }));
      toast.add({ type: "success", title: "Retraining started" });
    } catch {
      toast.add({ type: "error", title: "Couldn't start retraining" });
    }
  }

  async function handleDelete(sourceId: string) {
    try {
      const res = await fetch(`/api/agents/${agentId}/sources/${sourceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't delete source");

      setSources((current) => current.filter((s) => s.id !== sourceId));
      clearRun(sourceId);
      toast.add({ type: "success", title: "Source deleted" });
    } catch {
      toast.add({ type: "error", title: "Couldn't delete source" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Sources</CardTitle>
            <CardDescription>
              Add a URL — Firecrawl scrapes it and it&apos;s embedded right away.
            </CardDescription>
          </div>
          <AddSourceDialog agentId={agentId} onQueued={handleQueued} />
        </div>
      </CardHeader>
      <CardContent>
        <SourcesTable
          sources={sources}
          activeRuns={activeRuns}
          onRetrain={handleRetrain}
          onDelete={handleDelete}
          onRunSettled={settleRun}
        />
      </CardContent>
    </Card>
  );
}
