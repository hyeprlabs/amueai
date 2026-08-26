import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMedia } from "@/lib/media";
import type { Author } from "@/payload-types";

/** Author avatar, name and publish meta — used wherever a post credits its author. */
export function AuthorInfo({
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
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <Avatar>
        {avatar && <AvatarImage alt={avatar.alt} src={avatar.src} />}
        <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-sm">
        <span className="font-medium">{author.name}</span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
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
