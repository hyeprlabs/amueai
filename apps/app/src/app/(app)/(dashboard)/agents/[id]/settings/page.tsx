import type { Metadata } from "next";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/agents";
import { createMetadata } from "@/lib/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentSettingsForm } from "@/components/dashboard/agents/agent-settings-form";
import { DeleteAgentDialog } from "@/components/dashboard/agents/delete-agent-dialog";

export const metadata: Metadata = createMetadata({
  title: "Agent settings",
  description: "General settings for this agent.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentSettingsPage({ params }: PageProps<"/agents/[id]/settings">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("agents")
    .select("id, name, temperature, welcome_message")
    .eq("id", id)
    .single();

  const agent = requireAgent(data);

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Name, welcome message, and temperature. Model and instructions live in the Playground.
        </p>
      </div>

      <Card>
        <CardContent>
          <AgentSettingsForm
            agentId={agent.id}
            defaultValues={{
              name: agent.name,
              temperature: agent.temperature,
              welcome_message: agent.welcome_message,
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
          <DeleteAgentDialog agentId={agent.id} agentName={agent.name} />
        </CardContent>
      </Card>
    </div>
  );
}
