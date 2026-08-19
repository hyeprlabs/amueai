import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function Page() {
  return (
    <AppShell>
      <DashboardSkeleton />
    </AppShell>
  );
}
