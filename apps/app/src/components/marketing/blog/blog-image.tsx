import Image from "next/image";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { resolveMedia } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { Media } from "@/payload-types";

const IMAGE_FRAME =
  "rounded-lg border border-border outline outline-1 outline-offset-4 outline-border/30";

export function BlogImage({
  media,
  size = "card",
  sizes = "100vw",
  className,
  imageClassName,
  loading = "lazy",
}: {
  media: number | Media | null | undefined;
  size?: "thumbnail" | "card" | "og";
  sizes?: string;
  className?: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
}) {
  const image = resolveMedia(media, size);

  return (
    <AspectRatio className={cn("w-full shrink-0 overflow-hidden", IMAGE_FRAME, className)} ratio={16 / 9}>
      {image ? (
        <Image
          alt={image.alt}
          className={cn("object-cover", imageClassName)}
          fill
          loading={loading}
          sizes={sizes}
          src={image.src}
        />
      ) : (
        <div className="size-full bg-accent/30" />
      )}
    </AspectRatio>
  );
}
