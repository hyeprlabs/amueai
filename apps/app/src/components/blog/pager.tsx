import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Pager({
  basePath,
  page,
  hasNextPage,
  hasPrevPage,
}: {
  basePath: string;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}) {
  if (!hasNextPage && !hasPrevPage) return null;

  return (
    <div className="flex items-center justify-between border-t p-4">
      <Button
        disabled={!hasPrevPage}
        nativeButton={false}
        render={<Link href={`${basePath}?page=${page - 1}`} />}
        variant="outline"
      >
        Previous
      </Button>
      <span className="text-muted-foreground text-sm">Page {page}</span>
      <Button
        disabled={!hasNextPage}
        nativeButton={false}
        render={<Link href={`${basePath}?page=${page + 1}`} />}
        variant="outline"
      >
        Next
      </Button>
    </div>
  );
}
