"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/payload-types";

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
          <Button className="group w-max" size="sm" variant="outline">
            {activeCategory?.title ?? "All categories"}
            <ChevronDownIcon
              className="transition-transform duration-200 group-data-popup-open:rotate-180"
              data-icon="inline-end"
            />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56" sideOffset={8}>
        <DropdownMenuItem render={<Link href="/blog" />}>All categories</DropdownMenuItem>
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            render={<Link href={`/blog?category=${category.slug}`} />}
          >
            {category.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
