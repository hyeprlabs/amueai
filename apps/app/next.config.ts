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
  // Same-origin proxy to the c15t consent backend. Keeps the Inth runtime
  // origin out of client config, avoids CORS/ad-blocker issues, and lets the
  // backend URL change without a client redeploy.
  //
  // Skipped when NEXT_PUBLIC_C15T_URL isn't set (a rewrite pointing at
  // "undefined" fails the Next.js build) rather than as a runtime fallback —
  // consent management has no safe default, so a missing backend should be
  // visibly broken (client-side fetches to /api/c15t 404) rather than silently
  // inert.
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_C15T_URL) return [];

    return [
      {
        source: "/api/c15t/:path*",
        destination: `${process.env.NEXT_PUBLIC_C15T_URL}/:path*`,
      },
    ];
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
