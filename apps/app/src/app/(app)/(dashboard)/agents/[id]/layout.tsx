import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareTextIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { AgentTabsNav } from "./agent-tabs-nav";

export default async function AgentLayout({ children, params }: LayoutProps<"/agents/[id]">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase.from("agents").select("id, name").eq("id", id).single();

  if (!agent) notFound();

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

      <AgentTabsNav agentId={agent.id} />

      {children}
    </div>
  );
}
