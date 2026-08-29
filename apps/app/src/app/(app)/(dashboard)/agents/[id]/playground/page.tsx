import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { getGatewayChatModels } from "@/lib/gateway-models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentInstructionsForm } from "./agent-instructions-form";
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
  // switching models never silently strands the agent on an invalid one.
  const models = gatewayModels.some((model) => model.id === agent.model)
    ? gatewayModels
    : [{ id: agent.model, name: agent.model, provider: "current" }, ...gatewayModels];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Playground</h1>
        <p className="text-sm text-muted-foreground">
          Calls the same API the public widget uses. Switch models right from the chat.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <TestChat agentId={id} models={models} defaultModel={agent.model} />

        <Card className="gap-3 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4">
            <AgentInstructionsForm
              agentId={agent.id}
              defaultValues={{ system_prompt: agent.system_prompt }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
