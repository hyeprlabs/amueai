import type { Metadata } from "next";
import { OrganizationProfile } from "@clerk/nextjs";

import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Organization Settings",
  description: "Manage your organization and members.",
  pathname: "/settings/organization",
  noIndex: true,
});

export default async function Page() {
  return (
    <div className="flex w-full justify-start">
      <OrganizationProfile path="/settings/organization" routing="path" />
    </div>
  );
}
