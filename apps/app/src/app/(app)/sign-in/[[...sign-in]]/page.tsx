import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { siteConfig } from "@/config/site";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Sign in",
  description: `Sign in to your ${siteConfig.name} account.`,
  pathname: "/sign-in",
  noIndex: true,
});

export default function Page() {
  return <SignIn />;
}
