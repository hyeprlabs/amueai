import Link from "next/link";

import { BlogImage } from "@/components/marketing/blog/blog-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Category, Post } from "@/payload-types";

export function PostCard({ post, className, ...props }: React.ComponentProps<"a"> & { post: Post }) {
  const author = typeof post.author === "object" ? post.author : undefined;
  const categories = (post.categories ?? []).filter(
    (category): category is Category => typeof category === "object",
  );
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
        "group flex w-full flex-col gap-3 rounded-xl p-2 hover:cursor-pointer hover:bg-accent/30 active:bg-accent sm:p-3 dark:active:bg-accent/50",
        className,
      )}
      href={`/blog/${post.slug}`}
      {...props}
    >
      <BlogImage
        imageClassName="transition-transform duration-500 group-hover:scale-105"
        media={post.featuredImage}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />

      <div className="space-y-2 px-1">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Badge className="rounded-md" key={category.id} variant="outline">
                {category.title}
              </Badge>
            ))}
          </div>
        )}
        <h2 className="line-clamp-2 font-medium text-foreground text-lg md:text-xl">{post.title}</h2>
        <p className="line-clamp-2 text-muted-foreground text-sm group-hover:text-foreground md:text-base">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs group-hover:text-foreground md:text-sm">
          {author && <span>{author.name}</span>}
          {author && date && <span aria-hidden>·</span>}
          {date && <time dateTime={post.publishedAt ?? undefined}>{date}</time>}
        </div>
      </div>
    </Link>
  );
}
