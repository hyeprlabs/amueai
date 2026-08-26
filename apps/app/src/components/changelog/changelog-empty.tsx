import Link from "next/link";
import { ArrowUpRightIcon, HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Empty state shown when there are no published changelog entries yet. */
export function ChangelogEmpty({ className }: { className?: string }) {
  return (
    <Empty className={cn("border-none", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HistoryIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No updates yet</EmptyTitle>
        <EmptyDescription>Check back soon — we ship changes here as they land.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          className="text-muted-foreground"
          nativeButton={false}
          render={
            <Link href="/">
              Explore {siteConfig.name} <ArrowUpRightIcon aria-hidden />
            </Link>
          }
          size="sm"
          variant="link"
        />
      </EmptyContent>
    </Empty>
  );
}
