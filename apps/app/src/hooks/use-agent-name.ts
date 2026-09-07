"use client";

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";

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
