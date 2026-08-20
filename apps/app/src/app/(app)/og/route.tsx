import { ImageResponse } from "next/og";

import { LogoIcon } from "@/components/logo";
import { siteConfig } from "@/config/site";
import { OG_IMAGE_SIZE, OG_TITLE_MAX_LENGTH } from "@/lib/og-image";

/** The card only changes when its title does, so let caches hold on to it. */
const cacheControl = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * Renders the social preview card for the whole site.
 *
 * Satori supports only flexbox and a subset of CSS, so the layout stays on
 * plain flex containers with inline styles.
 */
export function GET(request: Request): ImageResponse {
  const title =
    new URL(request.url).searchParams.get("title")?.slice(0, OG_TITLE_MAX_LENGTH) ||
    siteConfig.tagline;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        backgroundColor: siteConfig.themeColor.dark,
        backgroundImage:
          "radial-gradient(circle at 12% 0%, rgba(250,250,250,0.16), transparent 55%)",
        color: "#fafafa",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <LogoIcon height={72} style={{ color: "#fafafa" }} width={72} />
        <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>{siteConfig.name}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <span style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
          {title}
        </span>
        <span style={{ fontSize: 32, lineHeight: 1.4, color: "#a1a1a1" }}>
          {siteConfig.description}
        </span>
      </div>

      <span style={{ fontSize: 28, color: "#a1a1a1" }}>{new URL(siteConfig.url).host}</span>
    </div>,
    { ...OG_IMAGE_SIZE, headers: { "Cache-Control": cacheControl } },
  );
}
