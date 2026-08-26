import { RichText } from "@payloadcms/richtext-lexical/react";

import { Badge } from "@/components/ui/badge";
import { CHANGELOG_TYPES } from "@/lib/changelog-types";
import { cn } from "@/lib/utils";
import type { Changelog } from "@/payload-types";

const TYPE_LABELS = Object.fromEntries(
  CHANGELOG_TYPES.map(({ value, label }) => [value, label]),
) as Record<Changelog["type"], string>;

const TYPE_BADGE_VARIANT: Record<
  Changelog["type"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  feature: "default",
  improvement: "secondary",
  fix: "outline",
  breaking: "destructive",
};

/** A single dated entry in the `/changelog` timeline, anchorable via `#slug`. */
export function ChangelogEntry({ entry }: { entry: Changelog }) {
  const date = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  return (
    <article className="scroll-mt-20 p-4" id={entry.slug}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={TYPE_BADGE_VARIANT[entry.type]}>{TYPE_LABELS[entry.type]}</Badge>
        {entry.version && (
          <span className="font-mono text-muted-foreground text-xs">{entry.version}</span>
        )}
        {date && (
          <time
            className="ml-auto text-muted-foreground text-xs uppercase"
            dateTime={entry.publishedAt ?? undefined}
          >
            {date}
          </time>
        )}
      </div>

      <a
        className={cn(
          "group mt-3 block w-fit font-semibold text-foreground text-xl tracking-tight sm:text-2xl",
          "hover:underline hover:underline-offset-4",
        )}
        href={`#${entry.slug}`}
      >
        {entry.title}
      </a>
      <p className="mt-1.5 text-muted-foreground text-sm sm:text-base">{entry.shortDescription}</p>

      <RichText className="richtext mt-4" data={entry.content} />
    </article>
  );
}
