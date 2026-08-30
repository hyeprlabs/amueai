import { Fragment } from "react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** One crumb in the trail. `href` present means "link to it"; absent means "current page". */
export type BreadcrumbTrailItem = {
  title: string;
  href?: string;
};

/**
 * The header's breadcrumb trail for every dashboard page - deliberately
 * text-only (no per-crumb icons) so it reads as a plain location trail,
 * with BreadcrumbSeparator's own chevron as the only graphic between
 * crumbs.
 */
export function AppBreadcrumbs({ trail }: { trail: BreadcrumbTrailItem[] }) {
  if (trail.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        {trail.map((item, index) => (
          <Fragment key={`${item.title}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink render={<Link href={item.href} />}>{item.title}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
