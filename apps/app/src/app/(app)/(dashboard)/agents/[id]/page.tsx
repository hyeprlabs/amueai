import { redirect } from "next/navigation";

export default async function AgentPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  redirect(`/agents/${id}/overview`);
}
