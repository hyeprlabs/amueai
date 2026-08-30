import { OrganizationSwitcher } from "@clerk/nextjs";
import { BuildingIcon } from "lucide-react";

import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";

/**
 * Shown wherever a page needs an active workspace and there isn't one.
 * AmueAI workspaces are Clerk organizations, so the switcher is rendered
 * inline - picking one here is the whole fix, no navigating away first.
 *
 * The Agents list, Usage and the onboarding page all hit this state; they
 * used to each spell it out with slightly different copy.
 */
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
