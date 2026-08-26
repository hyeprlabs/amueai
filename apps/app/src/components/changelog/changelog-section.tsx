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
    <article className="scroll-mt-20 flex flex-col gap-3 p-4" id={entry.slug}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="rounded-md" variant="outline">
          {TYPE_LABELS[entry.type]}
        </Badge>
        {date && (
          <time
            className="font-mono text-muted-foreground text-xs uppercase"
            dateTime={entry.publishedAt ?? undefined}
          >
            {date}
          </time>
        )}
      </div>

      <h3 className="font-semibold text-foreground text-xl tracking-tight md:text-2xl">
        {entry.title}
      </h3>

      <RichText className="richtext" data={entry.content} />
    </article>
  );
}
