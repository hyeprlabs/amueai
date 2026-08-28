import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { getGatewayChatModels } from "@/lib/gateway-models";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentSettingsForm } from "./agent-settings-form";
import { DeleteAgentButton } from "./delete-agent-button";

export const metadata: Metadata = createMetadata({
  title: "Agent settings",
  description: "Configure how this agent answers.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentSettingsPage({ params }: PageProps<"/agents/[id]/settings">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, system_prompt, model, temperature")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const gatewayModels = await getGatewayChatModels();
  // The agent's current model might have been deprecated/removed from the
  // Gateway catalog since it was picked - keep it selectable regardless so
  // saving the rest of the form doesn't silently change the model.
  const models = gatewayModels.some((model) => model.id === agent.model)
    ? gatewayModels
    : [{ id: agent.model, name: agent.model, provider: "current" }, ...gatewayModels];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Base instructions, model, and temperature.</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentSettingsForm
            agentId={agent.id}
            defaultValues={{
              name: agent.name,
              system_prompt: agent.system_prompt,
              model: agent.model,
              temperature: agent.temperature,
            }}
            models={models}
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
