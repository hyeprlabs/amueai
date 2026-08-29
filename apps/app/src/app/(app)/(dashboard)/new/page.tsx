import type { Metadata } from "next";

import { createMetadata } from "@/lib/seo";
import { NewPage } from "./new-page";

export const metadata: Metadata = createMetadata({
  title: "New agent",
  description: "Train a new AI agent on your data.",
  pathname: "/new",
  noIndex: true,
});

export default function Page() {
  return <NewPage />;
}
