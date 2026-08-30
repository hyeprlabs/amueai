import type { Metadata } from "next";
import { LinkIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAgent } from "@/lib/agents";
import { createMetadata } from "@/lib/seo";
import { AUTO_MODEL_ID, getGatewayChatModels } from "@/lib/gateway-models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentInstructionsForm } from "@/components/dashboard/agents/agent-instructions-form";
import { ChatPreview } from "@/components/dashboard/agents/chat-preview";
import { ModelSwitcher } from "@/components/dashboard/agents/model-switcher";

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
  const [{ data }, { count: sourceCount }] = await Promise.all([
    supabase.from("agents").select("id, name, system_prompt, model").eq("id", id).single(),
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("agent_id", id),
  ]);

  const agent = requireAgent(data);

  const gatewayModels = await getGatewayChatModels();
  // The agent's current model might have been deprecated/removed from the
  // Gateway catalog since it was picked, or it might be the "auto" sentinel
  // (never itself a Gateway id) - either way keep it selectable so switching
  // models never silently strands the agent on an invalid one.
  const models =
    agent.model === AUTO_MODEL_ID || gatewayModels.some((model) => model.id === agent.model)
      ? gatewayModels
      : [{ id: agent.model, name: agent.model, provider: "current" }, ...gatewayModels];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Playground</h1>
        <p className="text-sm text-muted-foreground">A live preview of what visitors see.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Data sources</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="size-4" />
                  Links
                </span>
                <span className="font-medium">{sourceCount ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">Model</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <ModelSwitcher agentId={agent.id} defaultModel={agent.model} models={models} />
            </CardContent>
          </Card>

          <Card className="flex-1 gap-3 py-4">
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

        <ChatPreview agentId={id} agentName={agent.name} />
      </div>
    </div>
  );
}
