import type { Metadata } from "next";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Analytics",
  description: "Conversation volume, resolution rate and agent performance.",
  pathname: "/analytics",
  noIndex: true,
});

export default async function Page() {
  return <DashboardSkeleton />;
}
