import { EmbedChat } from "./embed-chat";

export default async function EmbedPage({ params }: PageProps<"/embed/[agentId]">) {
  const { agentId } = await params;

  return (
    <div className="h-screen w-screen">
      <EmbedChat agentId={agentId} />
    </div>
  );
}
