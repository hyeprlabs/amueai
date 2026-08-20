import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Sign in",
  description: "Welcome back! Please sign in to continue",
  pathname: "/sign-in",
  noIndex: true,
});

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  );
}
