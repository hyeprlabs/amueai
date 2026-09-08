import { notFound } from "next/navigation";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { Widget } from "./widget";

export default async function EmbedPage({ params }: PageProps<"/embed/[agentId]">) {
  const { agentId } = await params;

  const supabase = createServiceRoleSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("welcome_message")
    .eq("id", agentId)
    .single();

  if (!agent) notFound();

  return <Widget agentId={agentId} welcomeMessage={agent.welcome_message} />;
}
