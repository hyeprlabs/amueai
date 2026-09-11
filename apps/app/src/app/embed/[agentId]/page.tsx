import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { Widget } from "@/components/widget";

function getCachedAgent(agentId: string) {
  return unstable_cache(
    async () => {
      const supabase = createServiceRoleSupabaseClient();
      const { data } = await supabase
        .from("agents")
        .select("name, welcome_message")
        .eq("id", agentId)
        .single();
      return data;
    },
    ["embed-agent", agentId],
    { revalidate: 60, tags: [`agent-${agentId}`] },
  )();
}

export default async function EmbedPage({ params, searchParams }: PageProps<"/embed/[agentId]">) {
  const [{ agentId }, { side, mobile }] = await Promise.all([params, searchParams]);

  const agent = await getCachedAgent(agentId);
  if (!agent) notFound();

  return (
    <Widget
      agentId={agentId}
      agentName={agent.name}
      mobile={mobile === "1"}
      side={side === "left" ? "left" : "right"}
      welcomeMessage={agent.welcome_message}
    />
  );
}
