import Link from "next/link";

import { Button } from "@/components/ui/button";

function buildHref(basePath: string, page: number, params?: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }
  search.set("page", String(page));
  return `${basePath}?${search.toString()}`;
}

export function Pager({
  basePath,
  page,
  hasNextPage,
  hasPrevPage,
  params,
}: {
  basePath: string;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  /** Non-pagination query params (e.g. category) to preserve across page links. */
  params?: Record<string, string | undefined>;
}) {
  if (!hasNextPage && !hasPrevPage) return null;

  return (
    <div className="flex items-center justify-between border-t p-4">
      <Button
        disabled={!hasPrevPage}
        nativeButton={false}
        render={<Link href={buildHref(basePath, page - 1, params)} />}
        variant="outline"
      >
        Previous
      </Button>
      <span className="text-muted-foreground text-sm">Page {page}</span>
      <Button
        disabled={!hasNextPage}
        nativeButton={false}
        render={<Link href={buildHref(basePath, page + 1, params)} />}
        variant="outline"
      >
        Next
      </Button>
    </div>
  );
}
