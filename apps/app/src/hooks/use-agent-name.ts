"use client";

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";

/**
 * The agent's name, for the header breadcrumb - the only place in the app
 * that needs it outside a page that already fetched it server side. The
 * header sits above the `/agents/[id]` layout in the tree (a sibling of
 * the page content, not a descendant of it), so it has no way to receive
 * a server-fetched value from that layout; a small client-side, RLS-scoped
 * read is the direct way to get it without threading state through a
 * context provider for one label.
 *
 * Returns undefined while loading or when agentId is undefined - the
 * caller decides what to show meanwhile (an ellipsis, nothing).
 */
export function useAgentName(agentId: string | undefined): string | undefined {
  const supabase = useSupabaseClient();
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!agentId) {
      setName(undefined);
      return;
    }

    let cancelled = false;
    setName(undefined);

    supabase
      .from("agents")
      .select("name")
      .eq("id", agentId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setName(data?.name);
      });

    return () => {
      cancelled = true;
    };
  }, [agentId, supabase]);

  return name;
}
