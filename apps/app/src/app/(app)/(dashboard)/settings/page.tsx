import type { Metadata } from "next";

import { ThemeSwitcher } from "@/components/dashboard/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Settings",
  description: "Manage your account and organization settings.",
  pathname: "/settings",
  noIndex: true,
});

export default async function Page() {
  return (
    <section className="max-w-2xl space-y-6">
      <header className="space-y-1">
        <h2 className="font-medium text-lg">General Settings</h2>
        <p className="text-muted-foreground text-sm">
          Update your account details and personal preferences from your profile.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how AmueAI looks across your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </section>
  );
}
