import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Analytics",
  description: "Conversation volume, resolution rate and agent performance.",
  pathname: "/analytics",
  noIndex: true,
});

export default async function Page() {
  await auth.protect();

  return (
    <AppShell>
      <DashboardSkeleton />
    </AppShell>
  );
}
