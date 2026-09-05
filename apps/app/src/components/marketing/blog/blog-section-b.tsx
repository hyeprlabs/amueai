import Link from "next/link";

import { BlogEmpty } from "@/components/marketing/blog/blog-empty";
import { CategoryDropdown } from "@/components/marketing/blog/category-dropdown";
import { FullWidthDivider } from "@/components/full-width-divider";
import { LazyImage } from "@/components/lazy-image";
import { Badge } from "@/components/ui/badge";
import { resolveMedia } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Author, Category, Post } from "@/payload-types";

/** `/blog` listing (variant B): same header + category switch as A, but an image grid. */
export function BlogSectionB({
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
    <div className="mb-12 flex w-full flex-col justify-start lg:mb-24">
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
          <div className="grid grid-cols-1 items-start gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
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
            title={activeCategorySlug ? "No Posts in This Category" : "No Posts Yet"}
          />
        )}
        <FullWidthDivider />
      </div>
    </div>
  );
}

function PostCard({ post, className, ...props }: React.ComponentProps<"a"> & { post: Post }) {
  const image = resolveMedia(post.featuredImage, "card");
  const author: Author | undefined = typeof post.author === "object" ? post.author : undefined;
  const postCategories = (post.categories ?? []).filter(
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
      {image ? (
        <LazyImage
          alt={image.alt}
          className="transition-transform duration-500 group-hover:scale-105"
          containerClassName="w-full shrink-0 rounded-lg border border-border outline outline-1 outline-offset-4 outline-border/30"
          fallback="https://placehold.co/640x360?text=Image"
          inView
          ratio={16 / 9}
          src={image.src}
        />
      ) : (
        <div className="aspect-video w-full shrink-0 rounded-lg border border-border bg-accent/30 outline outline-1 outline-offset-4 outline-border/30" />
      )}

      <div className="space-y-2 px-1">
        {postCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {postCategories.map((category) => (
              <Badge className="rounded-md" key={category.id} variant="outline">
                {category.title}
              </Badge>
            ))}
          </div>
        )}
        <h2 className="line-clamp-2 font-medium text-foreground text-lg md:text-xl">
          {post.title}
        </h2>
        <p className="line-clamp-2 text-muted-foreground text-sm group-hover:text-foreground md:text-base">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs group-hover:text-foreground md:text-sm">
          {author && <span>{author.name}</span>}
          {author && date && <span aria-hidden>·</span>}
          {date && <time dateTime={post.publishedAt ?? undefined}>{date}</time>}
          {(author || date) && post.readingTime && <span aria-hidden>·</span>}
          {post.readingTime && <span>{post.readingTime} min read</span>}
        </div>
      </div>
    </Link>
  );
}
