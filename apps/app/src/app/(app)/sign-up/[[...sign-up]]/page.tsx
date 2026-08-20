import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { siteConfig } from "@/config/site";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Create your account",
  description: `Create your ${siteConfig.name} account and start training your AI agent.`,
  pathname: "/sign-up",
  noIndex: true,
});

export default function Page() {
  return <SignUp />;
}
