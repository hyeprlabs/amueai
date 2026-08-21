import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMedia } from "@/lib/media";
import type { Author } from "@/payload-types";

export function AuthorByline({
  author,
  publishedAt,
  readingTime,
}: {
  author: Author;
  publishedAt?: string | null;
  readingTime?: number | null;
}) {
  const avatar = resolveMedia(author.avatar, "thumbnail");

  return (
    <div className="flex items-center gap-3">
      <Link aria-label={author.name} href={`/blog/author/${author.slug}`}>
        <Avatar size="lg">
          {avatar && <AvatarImage alt={avatar.alt} src={avatar.src} />}
          <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="text-sm">
        <Link className="font-medium hover:underline" href={`/blog/author/${author.slug}`}>
          {author.name}
        </Link>
        <div className="flex items-center gap-2 text-muted-foreground">
          {publishedAt && (
            <time dateTime={publishedAt}>
              {new Date(publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {publishedAt && readingTime && <span aria-hidden>·</span>}
          {readingTime && <span>{readingTime} min read</span>}
        </div>
      </div>
    </div>
  );
}
