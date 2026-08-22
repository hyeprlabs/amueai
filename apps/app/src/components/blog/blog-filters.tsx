"use client";

import { useQueryStates } from "nuqs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogSearchParams } from "@/lib/blog-search-params";
import type { Category, Tag } from "@/payload-types";

/** Category/tag filter chips for `/blog`, backed by nuqs query-param state. */
export function BlogFilters({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const [{ category, tag }, setFilters] = useQueryStates(blogSearchParams, { shallow: false });

  if (categories.length === 0 && tags.length === 0) return null;

  const hasActiveFilter = Boolean(category || tag);

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge
              key={c.id}
              className="cursor-pointer"
              render={
                <button
                  onClick={() =>
                    setFilters({ category: category === c.slug ? null : c.slug, page: 1 })
                  }
                  type="button"
                />
              }
              variant={category === c.slug ? "default" : "outline"}
            >
              {c.title}
            </Badge>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge
              key={t.id}
              className="cursor-pointer"
              render={
                <button
                  onClick={() => setFilters({ tag: tag === t.slug ? null : t.slug, page: 1 })}
                  type="button"
                />
              }
              variant={tag === t.slug ? "secondary" : "outline"}
            >
              #{t.title}
            </Badge>
          ))}
        </div>
      )}
      {hasActiveFilter && (
        <Button
          className="w-fit"
          onClick={() => setFilters({ category: null, tag: null, page: 1 })}
          size="sm"
          variant="ghost"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
