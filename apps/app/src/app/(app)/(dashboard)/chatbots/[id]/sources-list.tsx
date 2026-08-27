"use client";

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";
import type { Tables } from "@/types/supabase";

type SourceRow = Pick<
  Tables<"sources">,
  "id" | "label" | "type" | "status" | "error_message" | "created_at"
>;

/** Live queued/processing/ready/failed status via Supabase Realtime. */
export function SourcesList({
  chatbotId,
  initialSources,
}: {
  chatbotId: string;
  initialSources: SourceRow[];
}) {
  const supabase = useSupabaseClient();
  const [sources, setSources] = useState(initialSources);

  useEffect(() => {
    const channel = supabase
      .channel(`sources:${chatbotId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sources", filter: `chatbot_id=eq.${chatbotId}` },
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
  }, [supabase, chatbotId]);

  if (sources.length === 0) return null;

  return (
    <ul className="divide-y rounded-lg border">
      {sources.map((source) => (
        <li key={source.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-medium">{source.label}</p>
            {source.status === "failed" && source.error_message && (
              <p className="text-xs text-destructive">{source.error_message}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground capitalize">{source.status}</span>
        </li>
      ))}
    </ul>
  );
}
