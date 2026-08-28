import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareTextIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { getGatewayChatModels } from "@/lib/gateway-models";
import { siteConfig } from "@/config/site";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddSourceDialog } from "./add-source-form";
import { AgentSettingsForm } from "./agent-settings-form";
import { DeleteAgentButton } from "./delete-agent-button";
import { SourcesList } from "./sources-list";
import { TestChat } from "./test-chat";

export const metadata: Metadata = createMetadata({
  title: "Agent settings",
  description: "Configure how this agent answers.",
  pathname: "/agents",
  noIndex: true,
});

export default async function AgentSettingsPage({ params }: PageProps<"/agents/[id]">) {
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

  const { data: sources } = await supabase
    .from("sources")
    .select("id, label, type, status, error_message, created_at")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/agents" />}>Agents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{agent.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            Train it on your data, test it, then embed it on your site.
          </p>
        </div>
        <Button variant="outline" render={<Link href={`/agents/${agent.id}/conversations`} />}>
          <MessageSquareTextIcon />
          Conversations
        </Button>
      </div>

      <Tabs defaultValue="sources">
        <TabsList>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Data sources</CardTitle>
                  <CardDescription>
                    Text and URL sources are embedded right away. Q&amp;A and file sources are
                    queued.
                  </CardDescription>
                </div>
                <AddSourceDialog agentId={agent.id} />
              </div>
            </CardHeader>
            <CardContent>
              <SourcesList agentId={agent.id} initialSources={sources ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playground" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Playground</CardTitle>
              <CardDescription>Calls the same API the public widget uses.</CardDescription>
            </CardHeader>
            <CardContent>
              <TestChat agentId={agent.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
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

          <Card className="mt-4 ring-destructive/20">
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
        </TabsContent>

        <TabsContent value="embed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Embed on your site</CardTitle>
              <CardDescription>
                Paste this before <code>&lt;/body&gt;</code> on any page — no login required for
                visitors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
                {`<script src="${siteConfig.url}/widget.js" data-agent-id="${agent.id}" async></script>`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
