import { ChangelogEmpty } from "@/components/changelog/changelog-empty";
import { ChangelogEntry } from "@/components/changelog/changelog-entry";
import { FullWidthDivider } from "@/components/full-width-divider";
import type { Changelog } from "@/payload-types";

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
              <ChangelogEntry entry={entry} key={entry.id} />
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
