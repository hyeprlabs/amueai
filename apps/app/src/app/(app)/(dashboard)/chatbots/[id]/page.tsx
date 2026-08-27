import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateChatbot } from "../actions";

export const metadata: Metadata = createMetadata({
  title: "Chatbot settings",
  description: "Configure how this chatbot answers.",
  pathname: "/chatbots",
  noIndex: true,
});

export default async function ChatbotSettingsPage({ params }: PageProps<"/chatbots/[id]">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("id, name, system_prompt, model, temperature")
    .eq("id", id)
    .single();

  if (!chatbot) notFound();

  const updateChatbotWithId = updateChatbot.bind(null, chatbot.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">{chatbot.name}</h1>
        <p className="text-sm text-muted-foreground">
          Base instructions, model, and temperature for this chatbot.
        </p>
      </div>

      <form action={updateChatbotWithId} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={chatbot.name} required maxLength={200} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="system_prompt">System instructions</Label>
          <Textarea
            id="system_prompt"
            name="system_prompt"
            defaultValue={chatbot.system_prompt}
            required
            rows={6}
            maxLength={4000}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={chatbot.model} required />
          <p className="text-xs text-muted-foreground">
            An AI Gateway model string, e.g. <code>openai/gpt-4o-mini</code>.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            defaultValue={chatbot.temperature}
            required
            className="max-w-24"
          />
        </div>

        <div>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
