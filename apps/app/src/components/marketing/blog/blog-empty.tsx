import Link from "next/link";
import { ArrowUpRightIcon, NewspaperIcon } from "lucide-react";

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

/** Shared empty state for anywhere a post list can come back empty (the /blog index, a category with no posts, related posts, ...). */
export function BlogEmpty({
  className,
  title = "No Posts Yet",
  description = "Check back soon for new content.",
  categorySlug,
}: {
  className?: string;
  title?: string;
  description?: string;
  /** Active category filter, if any — renders a button to clear it. */
  categorySlug?: string;
}) {
  return (
    <Empty className={cn("border-none", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NewspaperIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {categorySlug && (
        <EmptyContent className="flex-row justify-center gap-2">
          <Button render={<Link href="/blog" />}>Browse All Posts</Button>
        </EmptyContent>
      )}
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
