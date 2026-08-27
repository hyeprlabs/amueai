import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateChatbot } from "../actions";
import { AddTextSourceForm } from "./add-text-source-form";

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

  const { data: sources } = await supabase
    .from("sources")
    .select("id, label, type, status, error_message, created_at")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false });

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

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-medium">Data sources</h2>
          <p className="text-sm text-muted-foreground">
            Plain text only for now — file, URL, and Q&amp;A sources land in a later phase.
          </p>
        </div>

        <AddTextSourceForm chatbotId={chatbot.id} />

        {sources && sources.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{source.label}</p>
                  {source.status === "failed" && source.error_message && (
                    <p className="text-xs text-destructive">{source.error_message}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">{source.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
