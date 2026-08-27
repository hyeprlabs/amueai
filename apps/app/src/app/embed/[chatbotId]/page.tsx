import { EmbedChat } from "./embed-chat";

export default async function EmbedPage({ params }: PageProps<"/embed/[chatbotId]">) {
  const { chatbotId } = await params;

  return (
    <div className="h-screen w-screen">
      <EmbedChat chatbotId={chatbotId} />
    </div>
  );
}
