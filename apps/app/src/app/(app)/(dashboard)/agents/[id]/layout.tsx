import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/agents";

// The "Agents / {name}" trail lives in the app header (AppHeader +
// useAgentName), not here - this layout's only job is confirming the agent
// is visible to the active org before any of its tabs render.
export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("agents").select("id").eq("id", id).single();

  requireAgent(data);

  return <div className="flex max-w-5xl flex-col gap-4">{children}</div>;
}
