import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeftIcon } from "lucide-react";

import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NewAgentForm } from "@/components/dashboard/new/new-agent-form";
import { NoWorkspace } from "@/components/dashboard/no-workspace";

export const metadata: Metadata = createMetadata({
  title: "New agent",
  description: "Train a new AI agent on your data.",
  pathname: "/new",
  noIndex: true,
});

// Full-page onboarding, deliberately outside the (dashboard) route group -
// it must not render inside AppShell's sidebar/header chrome - so auth is
// enforced here directly instead of inheriting it from that layout.
export default async function NewAgentPage() {
  const { orgId } = await auth.protect();

  if (!orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <NoWorkspace className="max-w-md" />
      </div>
    );
  }

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
        <Logo className="mr-auto h-4.5" />

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;You can have a fully trained support agent live on your site in less than five
              minutes.&rdquo;
            </p>
            <footer className="font-mono font-semibold text-sm">~ AmueAI</footer>
          </blockquote>
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8 py-12">
        {/* Top Shades */}
        <div aria-hidden className="absolute inset-0 isolate -z-10 opacity-60 contain-strict">
          <div className="absolute top-0 right-0 h-320 w-140 -translate-y-87.5 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute top-0 right-0 h-320 w-60 -translate-y-87.5 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <Button
          className="absolute top-7 left-5"
          nativeButton={false}
          render={<Link href="/agents" />}
          variant="ghost"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Agents
        </Button>

        <div className="mx-auto w-full space-y-6 sm:w-md">
          <Logo className="h-4.5 lg:hidden" />
          <NewAgentForm />
        </div>
      </div>
    </main>
  );
}
