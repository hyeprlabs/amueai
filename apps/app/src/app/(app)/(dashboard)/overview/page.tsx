import type { Metadata } from "next";

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Overview",
  description: "Your agent activity at a glance.",
  pathname: "/overview",
  noIndex: true,
});

export default async function Page() {
  return <DashboardSkeleton />;
}
