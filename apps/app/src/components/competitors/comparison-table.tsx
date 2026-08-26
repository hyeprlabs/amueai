import { CheckIcon, XIcon } from "lucide-react";

import {
  Table,
  TableBody,
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
 * No card, no rounded box, no side padding: it bleeds edge to edge like the
 * rest of the app's grid, with a plain top border, so it reads as part of the
 * page rather than a widget dropped into it. Built on the shadcn `Table`
 * primitives so it's a real `<table>` for screen readers and crawlers. The
 * `<caption>` carries the summary line and is the table's accessible name,
 * not just decoration above it.
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
      <Table className="border-separate border-spacing-0">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="border-b" scope="col">
              Aspect
            </TableHead>
            <TableHead
              className="border-b border-l bg-primary/5 text-center font-semibold text-foreground"
              scope="col"
            >
              {siteConfig.name}
            </TableHead>
            <TableHead className="border-b border-l text-center font-medium" scope="col">
              {competitorName}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow className="hover:bg-transparent" key={row.id ?? index}>
              <TableHead className="border-t font-medium" scope="row">
                {row.label}
              </TableHead>
              {row.usValue ? (
                <>
                  <TableCell className="border-t border-l bg-primary/5 text-center">
                    {row.usValue}
                  </TableCell>
                  <TableCell className="border-t border-l text-center">
                    {row.competitorValue}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="border-t border-l bg-primary/5 text-center">
                    <SupportIcon supported={row.usSupported} />
                  </TableCell>
                  <TableCell className="border-t border-l text-center">
                    <SupportIcon supported={row.competitorSupported} />
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
