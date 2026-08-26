import { siteConfig } from "@/config/site";
import type { Competitor } from "@/payload-types";

type ComparisonRow = NonNullable<Competitor["comparison"]>[number];

/**
 * The side-by-side feature table.
 *
 * A real `<table>` with scoped headers and a caption: it is the part of a
 * comparison page search engines and screen readers both read structurally, so
 * it is never faked with divs.
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
        {siteConfig.name} vs {competitorName}, feature by feature
      </h2>

      <div className="overflow-x-auto p-4 pt-2">
        <table className="w-full min-w-lg border-collapse text-left text-sm">
          <caption className="sr-only">
            A feature-by-feature comparison of {siteConfig.name} and {competitorName}.
          </caption>
          <thead>
            <tr className="border-b">
              <th className="w-1/3 py-3 pr-4 font-medium text-muted-foreground" scope="col">
                Feature
              </th>
              <th className="w-1/3 py-3 pr-4 font-medium" scope="col">
                {siteConfig.name}
              </th>
              <th className="w-1/3 py-3 font-medium" scope="col">
                {competitorName}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, index) => (
              <tr key={row.id ?? index}>
                <th className="py-3 pr-4 align-top font-medium" scope="row">
                  {row.feature}
                </th>
                <td className="py-3 pr-4 align-top">{row.us}</td>
                <td className="py-3 align-top text-muted-foreground">{row.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
