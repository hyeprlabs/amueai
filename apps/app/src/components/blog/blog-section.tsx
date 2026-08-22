import Link from "next/link";
import { NewspaperIcon } from "lucide-react";

import { CategoryDropdown } from "@/components/category-dropdown";
import { FullWidthDivider } from "@/components/full-width-divider";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { Blog, Category } from "@/payload-types";

/** `/blog` listing: header, category switcher, and the divided post list. */
export function BlogSection({
  title,
  description,
  posts,
  categories,
  activeCategorySlug,
}: {
  title: string;
  description: string;
  posts: Blog[];
  categories: Category[];
  activeCategorySlug?: string;
}) {
  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center md:py-12">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-wide md:text-4xl">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {categories.length > 0 && (
          <CategoryDropdown activeSlug={activeCategorySlug} categories={categories} />
        )}
      </div>

      <div className="relative">
        <FullWidthDivider />
        {posts.length > 0 ? (
          <div className="divide-y">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <Empty className="border-none py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NewspaperIcon />
              </EmptyMedia>
              <EmptyTitle>No posts yet</EmptyTitle>
              <EmptyDescription>Check back soon for new content.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        <FullWidthDivider />
      </div>
    </div>
  );
}

function BlogCard({ post, className, ...props }: React.ComponentProps<"a"> & { post: Blog }) {
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

  return (
    <Link
      className={cn(
        "group flex h-24 w-full flex-col justify-center gap-y-1 p-4 hover:cursor-pointer hover:bg-accent/30 active:bg-accent dark:active:bg-accent/50",
        className,
      )}
      href={`/blog/${post.slug}`}
      {...props}
    >
      <div className="relative flex min-w-0 items-end justify-center gap-2">
        <h3 className="min-w-0 shrink truncate font-medium text-foreground text-lg md:text-xl">
          {post.title}
        </h3>
        <span className="mb-[6px] w-full shrink border-b-2 border-dashed" />
        {date && (
          <span className="shrink-0 whitespace-nowrap font-mono text-muted-foreground text-xs uppercase group-hover:text-foreground md:text-sm">
            {date}
          </span>
        )}
      </div>
      <div className="max-w-sm text-muted-foreground text-sm group-hover:text-foreground md:max-w-full md:text-base">
        {post.excerpt}
      </div>
    </Link>
  );
}
