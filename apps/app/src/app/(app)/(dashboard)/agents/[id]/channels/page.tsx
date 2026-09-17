import type { Metadata } from "next";
import { RadioTowerIcon } from "lucide-react";

import { createMetadata } from "@/lib/seo";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";

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
        <p className="text-sm text-muted-foreground">Where this agent answers questions.</p>
      </div>

      <DashboardEmpty
        description="Deploy this agent to Slack, WhatsApp, and more from here soon."
        icon={<RadioTowerIcon />}
        title="Channels coming soon"
      />
    </div>
  );
}
