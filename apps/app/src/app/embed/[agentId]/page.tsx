import { notFound } from "next/navigation";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { Widget } from "@/components/widget";

export default async function EmbedPage({ params, searchParams }: PageProps<"/embed/[agentId]">) {
  const [{ agentId }, { side }] = await Promise.all([params, searchParams]);

  const supabase = createServiceRoleSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("name, welcome_message")
    .eq("id", agentId)
    .single();

  if (!agent) notFound();

  return (
    <Widget
      agentId={agentId}
      agentName={agent.name}
      side={side === "left" ? "left" : "right"}
      welcomeMessage={agent.welcome_message}
    />
  );
}
