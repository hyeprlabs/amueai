import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentSettingsForm } from "./agent-settings-form";
import { DeleteAgentButton } from "./delete-agent-button";

export const metadata: Metadata = createMetadata({
  title: "Agent settings",
  description: "General settings for this agent.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentSettingsPage({ params }: PageProps<"/agents/[id]/settings">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, temperature")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Name and temperature. Model and instructions live in the Playground.
        </p>
      </div>

      <Card>
        <CardContent>
          <AgentSettingsForm
            agentId={agent.id}
            defaultValues={{
              name: agent.name,
              temperature: agent.temperature,
            }}
          />
        </CardContent>
      </Card>

      <Card className="ring-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete this agent, its sources, and its conversation history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAgentButton agentId={agent.id} agentName={agent.name} />
        </CardContent>
      </Card>
    </div>
  );
}
