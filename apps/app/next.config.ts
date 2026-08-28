import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Nothing gains from advertising the framework in every response header.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.github.dev"],
    },
  },
  // `/vs/<competitor>` articles have no index of their own — trimming the URL
  // should land on the page that lists them, not on a 404.
  async redirects() {
    return [{ source: "/vs", destination: "/competitors", permanent: true }];
  },
  // Every page below has a markdown rendition served via Accept negotiation
  // (see `src/proxy.ts` and `src/lib/markdown-render.ts`). `Vary: Accept`
  // must be declared here — not only set from the proxy — because Next's own
  // RSC-negotiation logic recomputes the `Vary` header on the way out and
  // silently drops anything the proxy set that it doesn't already know about.
  // The config-level `headers()` merge point runs after that and survives it.
  async headers() {
    const negotiableSources = [
      "/",
      "/about",
      "/pricing",
      "/contact",
      "/developers",
      "/features/agent",
      "/features/channels",
      "/blog",
      "/blog/:slug",
      "/changelog",
      "/competitors",
      "/vs/:slug",
      "/legal",
      "/legal/:slug",
    ];

    return negotiableSources.map((source) => ({
      source,
      headers: [{ key: "Vary", value: "Accept, Accept-Encoding" }],
    }));
  },
  images: {
    // Serve modern formats so Largest Contentful Paint stays cheap.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "storage.efferd.com", pathname: "/**" },
      // Payload uploads are served from Vercel Blob in every deployed environment.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
};

export default withPayload(nextConfig);
