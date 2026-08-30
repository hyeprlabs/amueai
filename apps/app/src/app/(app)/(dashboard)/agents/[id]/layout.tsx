import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// The "Agents / {name}" trail lives in the app header now (AppHeader +
// useAgentName), not here - this layout's only job left is confirming the
// agent exists before any of its tabs render.
export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase.from("agents").select("id").eq("id", id).single();

  if (!agent) notFound();

  return <div className="flex max-w-5xl flex-col gap-4">{children}</div>;
}
