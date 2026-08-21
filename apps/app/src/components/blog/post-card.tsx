import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveMedia } from "@/lib/media";
import type { Blog, Category } from "@/payload-types";

export function PostCard({ post }: { post: Blog }) {
  const image = resolveMedia(post.featuredImage, "card");
  const categories = (post.categories ?? []).filter(
    (category): category is Category => typeof category === "object",
  );

  return (
    <Link className="block" href={`/blog/${post.slug}`}>
      <Card className="gap-0 overflow-hidden py-0">
        {image && (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <Image
              alt={image.alt}
              className="object-cover transition-transform duration-300 hover:scale-105"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              src={image.src}
            />
          </div>
        )}
        <CardContent className="flex flex-col gap-3 p-4">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <Badge key={category.id} variant="secondary">
                  {category.title}
                </Badge>
              ))}
            </div>
          )}
          <h3 className="line-clamp-2 font-semibold tracking-tight">{post.title}</h3>
          <p className="line-clamp-2 text-muted-foreground text-sm">{post.excerpt}</p>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            )}
            {post.publishedAt && post.readingTime && <span aria-hidden>·</span>}
            {post.readingTime && <span>{post.readingTime} min read</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
