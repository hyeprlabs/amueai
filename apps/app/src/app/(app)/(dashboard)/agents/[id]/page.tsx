import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAgent } from "../actions";
import { AddSourceForm } from "./add-source-form";
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

  const { data: sources } = await supabase
    .from("sources")
    .select("id, label, type, status, error_message, created_at")
    .eq("agent_id", id)
    .order("created_at", { ascending: false });

  const updateAgentWithId = updateAgent.bind(null, agent.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            Base instructions, model, and temperature for this agent.
          </p>
        </div>
        <Link href={`/agents/${agent.id}/conversations`} className="text-sm underline">
          View conversations
        </Link>
      </div>

      <form action={updateAgentWithId} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={agent.name} required maxLength={200} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="system_prompt">System instructions</Label>
          <Textarea
            id="system_prompt"
            name="system_prompt"
            defaultValue={agent.system_prompt}
            required
            rows={6}
            maxLength={4000}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={agent.model} required />
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
            defaultValue={agent.temperature}
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
            Text, URL, Q&amp;A, or a file (.txt, .pdf, .docx).
          </p>
        </div>

        <AddSourceForm agentId={agent.id} />

        <SourcesList agentId={agent.id} initialSources={sources ?? []} />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-medium">Test chat</h2>
          <p className="text-sm text-muted-foreground">
            Calls the same API the public widget uses.
          </p>
        </div>
        <TestChat agentId={agent.id} />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-medium">Embed on your site</h2>
          <p className="text-sm text-muted-foreground">
            Paste this before <code>&lt;/body&gt;</code> on any page — no login required for
            visitors.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
          {`<script src="${siteConfig.url}/widget.js" data-agent-id="${agent.id}" async></script>`}
        </pre>
      </div>
    </div>
  );
}
