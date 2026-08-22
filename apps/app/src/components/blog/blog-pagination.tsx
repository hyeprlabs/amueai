"use client";

import { useRouter } from "next/navigation";
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function buildHref(basePath: string, page: number, params?: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function BlogPagination({
  basePath,
  page,
  totalPages,
  params,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  /** Non-pagination query params (e.g. category) to preserve across page links. */
  params?: Record<string, string | undefined>;
}) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const isFirst = page === 1;
  const isLast = page === totalPages;

  return (
    <Pagination className="border-t py-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            aria-disabled={isFirst ? true : undefined}
            aria-label="Go to first page"
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={isFirst ? undefined : buildHref(basePath, 1, params)}
            role={isFirst ? "link" : undefined}
          >
            <ChevronFirstIcon aria-hidden="true" size={16} />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            aria-disabled={isFirst ? true : undefined}
            aria-label="Go to previous page"
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={isFirst ? undefined : buildHref(basePath, page - 1, params)}
            role={isFirst ? "link" : undefined}
          >
            <ChevronLeftIcon aria-hidden="true" size={16} />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <Select
            aria-label="Select page"
            onValueChange={(value) => router.push(buildHref(basePath, Number(value), params))}
            value={String(page)}
          >
            <SelectTrigger className="w-fit whitespace-nowrap" id="select-page">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <SelectItem key={p} value={String(p)}>
                  Page {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            aria-disabled={isLast ? true : undefined}
            aria-label="Go to next page"
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={isLast ? undefined : buildHref(basePath, page + 1, params)}
            role={isLast ? "link" : undefined}
          >
            <ChevronRightIcon aria-hidden="true" size={16} />
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            aria-disabled={isLast ? true : undefined}
            aria-label="Go to last page"
            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={isLast ? undefined : buildHref(basePath, totalPages, params)}
            role={isLast ? "link" : undefined}
          >
            <ChevronLastIcon aria-hidden="true" size={16} />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
