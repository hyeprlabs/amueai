import { notFound } from "next/navigation";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { EmbedChat } from "./embed-chat";

// Public, unauthenticated route (no Clerk session) - same service-role
// client the chat API itself uses, since RLS has nothing to scope this to.
export default async function EmbedPage({ params }: PageProps<"/embed/[agentId]">) {
  const { agentId } = await params;

  const supabase = createServiceRoleSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("welcome_message")
    .eq("id", agentId)
    .single();

  if (!agent) notFound();

  return (
    <div className="h-screen w-screen">
      <EmbedChat agentId={agentId} welcomeMessage={agent.welcome_message} />
    </div>
  );
}
