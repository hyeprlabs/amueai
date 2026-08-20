import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Create your account",
  description: "Welcome! Please fill in the details to get started.",
  pathname: "/sign-up",
  noIndex: true,
});

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  );
}
