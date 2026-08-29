import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { getGatewayChatModels } from "@/lib/gateway-models";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentPersonalityForm } from "./agent-personality-form";
import { TestChat } from "./test-chat";

export const metadata: Metadata = createMetadata({
  title: "Playground",
  description: "Test this agent and tune its model and instructions.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentPlaygroundPage({
  params,
}: PageProps<"/agents/[id]/playground">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, system_prompt, model")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const gatewayModels = await getGatewayChatModels();
  // The agent's current model might have been deprecated/removed from the
  // Gateway catalog since it was picked - keep it selectable regardless so
  // saving instructions doesn't silently change the model.
  const models = gatewayModels.some((model) => model.id === agent.model)
    ? gatewayModels
    : [{ id: agent.model, name: agent.model, provider: "current" }, ...gatewayModels];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>Playground</CardTitle>
          <CardDescription>Calls the same API the public widget uses.</CardDescription>
        </CardHeader>
        <CardContent>
          <TestChat agentId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personality</CardTitle>
          <CardDescription>Model and instructions this agent answers with.</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentPersonalityForm
            agentId={agent.id}
            defaultValues={{ model: agent.model, system_prompt: agent.system_prompt }}
            models={models}
          />
        </CardContent>
      </Card>
    </div>
  );
}
