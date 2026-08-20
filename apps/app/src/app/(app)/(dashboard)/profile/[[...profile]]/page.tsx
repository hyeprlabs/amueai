import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";

import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Profile",
  description: "Manage your profile and account settings.",
  pathname: "/profile",
  noIndex: true,
});

export default async function Page() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and account settings.</p>
      </header>
      <UserProfile path="/profile" routing="path" />
    </div>
  );
}
