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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Name and temperature. Model and instructions live in the Playground.
          </CardDescription>
        </CardHeader>
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
          <CardTitle>Danger zone</CardTitle>
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
