"use client";

import { useQueryStates } from "nuqs";
import { useState } from "react";
import { FolderOpenIcon, TagIcon, XIcon } from "lucide-react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { blogSearchParams } from "@/lib/blog-search-params";
import type { Category, Tag } from "@/payload-types";

/** Category (single-select dropdown) and tag (multi-select combobox) filters for `/blog`. */
export function BlogFilters({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const [{ category, tags: selectedTags }, setFilters] = useQueryStates(blogSearchParams, {
    shallow: false,
  });
  const [tagQuery, setTagQuery] = useState("");

  if (categories.length === 0 && tags.length === 0) return null;

  const selectedCategory = categories.find((c) => c.slug === category);
  const hasActiveFilter = Boolean(category || selectedTags.length > 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-wrap items-end gap-4">
        {categories.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs">Category</Label>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className="min-w-40 justify-start" variant="outline">
                    <FolderOpenIcon data-icon="inline-start" />
                    {selectedCategory ? selectedCategory.title : "All categories"}
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="min-w-(--anchor-width)">
                <DropdownMenuItem onClick={() => setFilters({ category: null, page: 1 })}>
                  All categories
                </DropdownMenuItem>
                {categories.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => setFilters({ category: c.slug, page: 1 })}
                  >
                    {c.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-muted-foreground text-xs">Tags</Label>
            <Combobox
              items={tags}
              inputValue={tagQuery}
              itemToStringLabel={(t) => t.title}
              multiple
              onInputValueChange={setTagQuery}
              onValueChange={(next) => setFilters({ tags: next.map((t) => t.slug), page: 1 })}
              value={tags.filter((t) => selectedTags.includes(t.slug))}
            >
              <ComboboxChips className="w-full sm:min-w-64">
                <TagIcon className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
                {tags
                  .filter((t) => selectedTags.includes(t.slug))
                  .map((t) => (
                    <ComboboxChip key={t.id} aria-label={t.title}>
                      #{t.title}
                      <ComboboxChipRemove
                        onClick={() =>
                          setFilters({
                            tags: selectedTags.filter((slug) => slug !== t.slug),
                            page: 1,
                          })
                        }
                      />
                    </ComboboxChip>
                  ))}
                <ComboboxInput placeholder={selectedTags.length === 0 ? "Filter by tag…" : ""} />
              </ComboboxChips>
              <ComboboxPopup>
                <ComboboxEmpty>No matching tags.</ComboboxEmpty>
                <ComboboxList>
                  {(t: Tag) => (
                    <ComboboxItem key={t.id} value={t}>
                      #{t.title}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxPopup>
            </Combobox>
          </div>
        )}
      </div>

      {hasActiveFilter && (
        <Button
          onClick={() => {
            setFilters({ category: null, tags: [], page: 1 });
            setTagQuery("");
          }}
          size="sm"
          variant="ghost"
        >
          <XIcon data-icon="inline-start" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
