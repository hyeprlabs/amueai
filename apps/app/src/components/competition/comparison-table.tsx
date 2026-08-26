import { CheckIcon, XIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { Competitor } from "@/payload-types";

type ComparisonRow = NonNullable<Competitor["comparison"]>[number];

/**
 * The head-to-head table rendered at the top of every `/vs/` page.
 *
 * Competitor first, {@link siteConfig.name} second: a reader scanning left to
 * right meets the thing they searched for, then sees it lose the row to us.
 * Built on the shadcn `Table` primitives rather than plain markup so it picks
 * up the same states — hover, focus, dark mode — as every other table in the
 * app, and stays a real `<table>` for the screen readers and crawlers that
 * read a comparison page structurally.
 */
export function ComparisonTable({
  competitorName,
  rows,
}: {
  competitorName: string;
  rows: ComparisonRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <section className="border-t">
      <h2 className="p-4 pb-2 font-semibold text-xl tracking-tight sm:text-2xl">
        {siteConfig.name} vs {competitorName}
      </h2>

      <div className="px-4 pb-4">
        <Table className="border-separate border-spacing-0 overflow-hidden rounded-lg border">
          <TableCaption className="sr-only">
            A feature-by-feature comparison of {competitorName} and {siteConfig.name}.
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="border-b" scope="col">
                <span className="sr-only">Aspect</span>
              </TableHead>
              <TableHead className="border-b border-l text-center font-medium" scope="col">
                {competitorName}
              </TableHead>
              <TableHead
                className="border-b border-l bg-primary/5 text-center font-semibold text-foreground"
                scope="col"
              >
                {siteConfig.name}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow className="hover:bg-transparent" key={row.id ?? index}>
                <TableHead className="border-t font-medium" scope="row">
                  {row.feature}
                </TableHead>
                <TableCell className="border-t border-l text-center">
                  <SupportIcon supported={row.competitorSupported} />
                </TableCell>
                <TableCell className="border-t border-l bg-primary/5 text-center">
                  <SupportIcon supported={row.usSupported} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function SupportIcon({ supported }: { supported?: boolean | null }) {
  if (supported) {
    return (
      <CheckIcon
        aria-label="Yes"
        className="mx-auto size-4 text-emerald-600 dark:text-emerald-500"
      />
    );
  }

  return <XIcon aria-label="No" className={cn("mx-auto size-4 text-muted-foreground/60")} />;
}
