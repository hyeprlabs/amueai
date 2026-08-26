import Image from "next/image";
import Link from "next/link";

import { CompetitionEmpty } from "@/components/competition/competition-empty";
import { FullWidthDivider } from "@/components/full-width-divider";
import { resolveMedia } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Competitor } from "@/payload-types";

/** `/competition`: header and the divided list of competitors, each linking to its comparison. */
export function CompetitionSection({
  title,
  description,
  competitors,
}: {
  title: string;
  description: string;
  competitors: Competitor[];
}) {
  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex flex-col gap-2 px-4 py-8 md:py-12">
        <h1 className="font-semibold text-2xl tracking-wide md:text-4xl">{title}</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="relative">
        <FullWidthDivider />
        {competitors.length > 0 ? (
          <div className="divide-y">
            {competitors.map((competitor) => (
              <CompetitorRow competitor={competitor} key={competitor.id} />
            ))}
          </div>
        ) : (
          <CompetitionEmpty className="py-16" />
        )}
        <FullWidthDivider />
      </div>
    </div>
  );
}

function CompetitorRow({
  competitor,
  className,
  ...props
}: React.ComponentProps<"a"> & { competitor: Competitor }) {
  const logo = resolveMedia(competitor.logo, "thumbnail");

  return (
    <Link
      className={cn(
        "group flex min-h-24 w-full flex-col justify-center gap-y-1 p-4 hover:cursor-pointer hover:bg-accent/30 active:bg-accent dark:active:bg-accent/50",
        className,
      )}
      href={`/vs/${competitor.slug}`}
      {...props}
    >
      <div className="relative flex min-w-0 items-end justify-center gap-2">
        {logo && (
          <Image
            alt={logo.alt}
            className="mb-1 size-5 shrink-0 rounded-sm object-contain"
            height={20}
            src={logo.src}
            width={20}
          />
        )}
        <h2 className="min-w-0 shrink truncate font-medium text-foreground text-lg md:text-xl">
          {competitor.name}
        </h2>
        <span className="mb-[6px] w-full shrink border-b-2 border-dashed" />
        {competitor.bestFor && (
          <span className="hidden shrink-0 whitespace-nowrap font-mono text-muted-foreground text-xs uppercase group-hover:text-foreground sm:inline md:text-sm">
            {competitor.bestFor}
          </span>
        )}
      </div>
      <div className="line-clamp-2 max-w-sm text-muted-foreground text-sm group-hover:text-foreground md:max-w-full md:text-base">
        {competitor.excerpt}
      </div>
    </Link>
  );
}
