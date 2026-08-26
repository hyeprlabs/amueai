import { RichText } from "@payloadcms/richtext-lexical/react";

import { ChangelogEmpty } from "@/components/changelog/changelog-empty";
import { Badge } from "@/components/ui/badge";
import { FullWidthDivider } from "@/components/full-width-divider";
import { CHANGELOG_TYPES } from "@/lib/changelog-types";
import type { Changelog } from "@/payload-types";

const TYPE_LABELS = Object.fromEntries(
  CHANGELOG_TYPES.map(({ value, label }) => [value, label]),
) as Record<Changelog["type"], string>;

/** `/changelog`: header and the divided, dated list of entries. */
export function ChangelogSection({
  title,
  description,
  entries,
}: {
  title: string;
  description: string;
  entries: Changelog[];
}) {
  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex flex-col gap-2 px-4 py-8 md:py-12">
        <h1 className="font-semibold text-2xl tracking-wide md:text-4xl">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="relative">
        <FullWidthDivider />
        {entries.length > 0 ? (
          <div className="divide-y">
            {entries.map((entry) => (
              <ChangelogCard entry={entry} key={entry.id} />
            ))}
          </div>
        ) : (
          <ChangelogEmpty className="py-16" />
        )}
        <FullWidthDivider />
      </div>
    </div>
  );
}

function ChangelogCard({ entry }: { entry: Changelog }) {
  const date = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

  return (
    <article className="scroll-mt-20" id={entry.slug}>
      <a
        className="group flex min-h-24 w-full flex-col justify-center gap-y-1 p-4 hover:cursor-pointer hover:bg-accent/30 active:bg-accent dark:active:bg-accent/50"
        href={`#${entry.slug}`}
      >
        <div className="relative flex min-w-0 items-end justify-center gap-2">
          <Badge className="mb-[3px]" variant="secondary">
            {TYPE_LABELS[entry.type]}
          </Badge>
          <h3 className="min-w-0 shrink truncate font-medium text-foreground text-lg md:text-xl">
            {entry.title}
          </h3>
          <span className="mb-[6px] w-full shrink border-b-2 border-dashed" />
          {date && (
            <span className="shrink-0 whitespace-nowrap font-mono text-muted-foreground text-xs uppercase group-hover:text-foreground md:text-sm">
              {date}
            </span>
          )}
        </div>
        <div className="line-clamp-2 max-w-sm text-muted-foreground text-sm group-hover:text-foreground md:max-w-full md:text-base">
          {entry.shortDescription}
        </div>
      </a>

      <RichText className="richtext px-4 pb-4" data={entry.content} />
    </article>
  );
}
