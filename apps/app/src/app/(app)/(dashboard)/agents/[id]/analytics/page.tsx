import type { Metadata } from "next";
import { BarChart3Icon } from "lucide-react";

import { createMetadata } from "@/lib/seo";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = createMetadata({
  title: "Analytics",
  description: "Conversation activity for this agent.",
  pathname: "/agents",
  noIndex: true,
});

export default function AgentAnalyticsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Analytics</h1>
        <p className="text-sm text-muted-foreground">Conversation activity for this agent.</p>
      </div>

      <ComingSoon
        description="Conversation history and usage charts are on the way."
        icon={<BarChart3Icon />}
        title="Analytics coming soon"
      />
    </div>
  );
}
