import { OrganizationSwitcher } from "@clerk/nextjs";
import { BuildingIcon } from "lucide-react";

import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";

export function NoWorkspace({ className }: { className?: string }) {
  return (
    <DashboardEmpty
      className={className}
      description="AmueAI workspaces are Clerk organizations. Pick one to get started."
      icon={<BuildingIcon />}
      title="Select or create a workspace"
    >
      <OrganizationSwitcher hidePersonal />
    </DashboardEmpty>
  );
}
