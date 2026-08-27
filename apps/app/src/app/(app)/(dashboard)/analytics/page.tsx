import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3Icon } from "lucide-react";

import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = createMetadata({
  title: "Analytics",
  description: "Conversation volume, resolution rate and agent performance.",
  pathname: "/analytics",
  noIndex: true,
});

export default function AnalyticsPage() {
  return (
    <Empty className="min-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BarChart3Icon />
        </EmptyMedia>
        <EmptyTitle>Analytics coming soon</EmptyTitle>
        <EmptyDescription>
          Conversation volume, resolution rate, and agent performance will show up here once your
          agents start getting used.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link href="/agents">View your agents</Link>}
          variant="outline"
        />
      </EmptyContent>
    </Empty>
  );
}
