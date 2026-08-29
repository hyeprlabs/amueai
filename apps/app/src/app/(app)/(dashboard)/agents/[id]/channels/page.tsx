import type { Metadata } from "next";

import { createMetadata } from "@/lib/seo";
import { CHANNELS } from "@/lib/channels";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = createMetadata({
  title: "Channels",
  description: "Where this agent is deployed.",
  pathname: "/agents",
  noIndex: true,
});

export default function AgentChannelsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Channels</h1>
        <p className="text-sm text-muted-foreground">
          Where this agent answers questions. More channels are on the way.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.id}
              className="flex items-start gap-3 rounded-lg border p-3"
              data-included={channel.badge === "Included" ? "true" : undefined}
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {channel.label}
                  <Badge variant={channel.badge === "Included" ? "secondary" : "outline"}>
                    {channel.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{channel.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
