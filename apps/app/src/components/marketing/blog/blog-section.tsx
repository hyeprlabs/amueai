import { BlogEmpty } from "@/components/marketing/blog/blog-empty";
import { CategoryDropdown } from "@/components/marketing/blog/category-dropdown";
import { PostCard } from "@/components/marketing/blog/post-card";
import { FullWidthDivider } from "@/components/full-width-divider";
import type { Category, Post } from "@/payload-types";

/** `/blog` listing: header + category switch and an image grid of posts. */
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
