import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/dashboard/app-shell";

export default async function Layout({ children }: LayoutProps<"/">) {
  await auth.protect();

  return <AppShell>{children}</AppShell>;
}
