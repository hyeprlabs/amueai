import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HammerIcon, MessageSquareTextIcon, RadioTowerIcon } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import type { AgentBrand } from "@/lib/branding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";

export const metadata: Metadata = createMetadata({
  title: "Overview",
  description: "This agent's activity at a glance.",
  pathname: "/agents",
  noIndex: true,
});

const QUICK_LINKS = [
  {
    segment: "playground",
    title: "Test in the Playground",
    description: "Chat with it and tune its model and instructions.",
    icon: MessageSquareTextIcon,
  },
  {
    segment: "build",
    title: "Add sources",
    description: "Train it on a URL, then embed it on your site.",
    icon: HammerIcon,
  },
  {
    segment: "channels",
    title: "Deploy it",
    description: "See where it can answer questions.",
    icon: RadioTowerIcon,
  },
] as const;

export default async function AgentOverviewPage({ params }: PageProps<"/agents/[id]/overview">) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id, name, model, created_at, brand")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const brand = agent.brand as AgentBrand | null;

  const [{ count: sourceCount }, { count: conversationCount }] = await Promise.all([
    supabase.from("sources").select("id", { count: "exact", head: true }).eq("agent_id", id),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("agent_id", id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Created {new Date(agent.created_at).toLocaleDateString()}
        </p>
      </div>

      {brand && (
        <Card className="flex-row items-center gap-4 p-4">
          {brand.logo && (
            // Firecrawl returns an arbitrary third-party logo URL, which
            // next/image would need whitelisted in remotePatterns per
            // customer domain - impossible for user-supplied sites.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt="" className="size-10 shrink-0 rounded-md object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{brand.name ?? "Brand detected"}</p>
            <p className="text-xs text-muted-foreground">Pulled from your site during setup.</p>
          </div>
          {brand.colors && (
            <div className="flex shrink-0 items-center gap-1.5">
              {[brand.colors.primary, brand.colors.background, brand.colors.text]
                .filter((color): color is string => Boolean(color))
                .map((color) => (
                  <span
                    key={color}
                    title={color}
                    style={{ backgroundColor: color }}
                    className="size-5 rounded-full ring-1 ring-foreground/15"
                  />
                ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{sourceCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{conversationCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Model</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-2xl font-semibold">{agent.model}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.segment} href={`/agents/${id}/${link.segment}`} className="group">
              <Card className="h-full gap-2 p-4 transition-shadow group-hover:shadow-md group-hover:ring-foreground/20">
                <IconTile variant="soft" size="sm">
                  <Icon />
                </IconTile>
                <p className="text-sm font-medium">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
