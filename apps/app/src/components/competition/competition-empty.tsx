import Link from "next/link";
import { ArrowUpRightIcon, SwordsIcon } from "lucide-react";

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

/** Empty state shown when no competitor comparison has been published yet. */
export function CompetitionEmpty({ className }: { className?: string }) {
  return (
    <Empty className={cn("border-none", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SwordsIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No comparisons yet</EmptyTitle>
        <EmptyDescription>
          Check back soon — we publish a side-by-side breakdown for every alternative worth
          comparing.
        </EmptyDescription>
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
