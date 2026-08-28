import { RichText } from "@payloadcms/richtext-lexical/react";

import { ChangelogEmpty } from "@/components/marketing/pages/changelog/changelog-empty";
import { Badge } from "@/components/ui/badge";
import { FullWidthDivider } from "@/components/marketing/full-width-divider";
import { CHANGE_TYPES } from "@/lib/change-types";
import type { Change } from "@/payload-types";

const TYPE_LABELS = Object.fromEntries(
  CHANGE_TYPES.map(({ value, label }) => [value, label]),
) as Record<Change["type"], string>;

/** `/changelog`: header and the divided, dated list of changes. */
export function ChangelogSection({
  title,
  description,
  changes,
}: {
  title: string;
  description: string;
  changes: Change[];
}) {
  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex flex-col gap-2 px-4 py-8 md:py-12">
        <h1 className="font-semibold text-2xl tracking-wide md:text-4xl">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="relative">
        <FullWidthDivider />
        {changes.length > 0 ? (
          <div className="divide-y">
            {changes.map((change) => (
              <ChangeRow change={change} key={change.id} />
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

function ChangeRow({ change }: { change: Change }) {
  const date = change.publishedAt
    ? new Date(change.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

  return (
    <article className="scroll-mt-20 flex flex-col gap-3 p-4" id={change.slug}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="rounded-md" variant="outline">
          {TYPE_LABELS[change.type]}
        </Badge>
        {date && (
          <time
            className="font-mono text-muted-foreground text-xs uppercase md:text-sm"
            dateTime={change.publishedAt ?? undefined}
          >
            {date}
          </time>
        )}
      </div>

      <h3 className="font-medium text-foreground text-lg md:text-xl">{change.title}</h3>

      <RichText className="richtext" data={change.content} />
    </article>
  );
}
