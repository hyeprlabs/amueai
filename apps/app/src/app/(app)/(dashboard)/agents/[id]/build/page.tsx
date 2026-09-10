import { redirect } from "next/navigation";

export default async function BuildPage({ params }: PageProps<"/agents/[id]/build">) {
  const { id } = await params;
  redirect(`/agents/${id}/build/sources`);
}
