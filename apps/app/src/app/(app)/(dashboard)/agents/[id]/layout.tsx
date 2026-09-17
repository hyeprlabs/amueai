import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirectAgents } from "@/lib/redirect-agents";

export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("agents").select("id").eq("id", id).single();

  redirectAgents(data);

  return <div className="flex max-w-5xl flex-col gap-4">{children}</div>;
}
