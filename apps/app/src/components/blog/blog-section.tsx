import Link from "next/link";

import { BlogEmpty } from "@/components/blog/blog-empty";
import { CategoryDropdown } from "@/components/blog/category-dropdown";
import { FullWidthDivider } from "@/components/marketing/full-width-divider";
import { cn } from "@/lib/utils";
import type { Category, Post } from "@/payload-types";

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
  posts: Post[];
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
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <BlogEmpty
            categorySlug={activeCategorySlug}
            className="py-16"
            description={
              activeCategorySlug
                ? "No posts in this category yet. Check back soon or browse everything else."
                : "Check back soon for new content."
            }
            title={activeCategorySlug ? "No posts in this category" : "No posts yet"}
          />
        )}
        <FullWidthDivider />
      </div>
    </div>
  );
}

function PostRow({ post, className, ...props }: React.ComponentProps<"a"> & { post: Post }) {
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
        "group flex min-h-24 w-full flex-col justify-center gap-y-1 p-4 hover:cursor-pointer hover:bg-accent/30 active:bg-accent dark:active:bg-accent/50",
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
      <div className="line-clamp-2 max-w-sm text-muted-foreground text-sm group-hover:text-foreground md:max-w-full md:text-base">
        {post.excerpt}
      </div>
    </Link>
  );
}
