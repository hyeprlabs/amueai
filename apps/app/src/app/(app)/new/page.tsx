import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { BotIcon } from "lucide-react";

import { createMetadata } from "@/lib/seo";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { NewPage } from "./new-page";

export const metadata: Metadata = createMetadata({
  title: "New agent",
  description: "Train a new AI agent on your data.",
  pathname: "/new",
  noIndex: true,
});

// Full-page onboarding, deliberately outside the (dashboard) route group -
// it must not render inside AppShell's sidebar/header chrome - so auth is
// enforced here directly instead of inheriting it from that layout.
export default async function Page() {
  const { orgId } = await auth.protect();

  if (!orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Empty className="max-w-md border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BotIcon />
            </EmptyMedia>
            <EmptyTitle>Select or create a workspace</EmptyTitle>
            <EmptyDescription>
              AmueAI workspaces are Clerk organizations. Pick one from the switcher before
              training an agent.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <OrganizationSwitcher hidePersonal />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return <NewPage />;
}
