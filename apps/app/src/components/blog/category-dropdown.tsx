"use client";

import Link from "next/link";
import { FolderIcon, FolderOpenIcon } from "lucide-react";
import { createSerializer, parseAsString } from "nuqs";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/payload-types";

const serialize = createSerializer({ category: parseAsString });

/** Category switcher shared by /blog and /blog/[slug] — every item links to /blog filtered by category. */
export function CategoryDropdown({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const activeCategory = categories.find((category) => category.slug === activeSlug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="group w-fit" size="sm" variant="outline">
            <FolderIcon
              aria-hidden
              className="group-data-popup-open:hidden"
              data-icon="inline-start"
            />
            <FolderOpenIcon
              aria-hidden
              className="hidden group-data-popup-open:block"
              data-icon="inline-start"
            />
            {activeCategory?.title ?? "All categories"}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
        <DropdownMenuItem render={<Link href={serialize("/blog", { category: null })} />}>
          All categories
        </DropdownMenuItem>
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            render={<Link href={serialize("/blog", { category: category.slug })} />}
          >
            {category.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
