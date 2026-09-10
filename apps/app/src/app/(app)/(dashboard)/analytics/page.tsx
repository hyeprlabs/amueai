import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3Icon } from "lucide-react";

import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";

export const metadata: Metadata = createMetadata({
  title: "Analytics",
  description: "Conversation volume, resolution rate and agent performance.",
  pathname: "/analytics",
  noIndex: true,
});

export default function AnalyticsPage() {
  return (
    <DashboardEmpty
      description="Conversation volume, resolution rate, and agent performance will show up here once your agents start getting used."
      icon={<BarChart3Icon />}
      title="Analytics coming soon"
    >
      <Button
        nativeButton={false}
        render={<Link href="/agents">View your agents</Link>}
        variant="outline"
      />
    </DashboardEmpty>
  );
}
