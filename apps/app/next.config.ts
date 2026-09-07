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
  async headers() {
    return [
      {
        // The embed route is meant to be framed from arbitrary customer
        // domains (that's the whole point of the widget) - an explicit
        // wildcard here documents that as intentional rather than leaving
        // it to browsers' unset-CSP default. Revisit if per-agent domain
        // allowlisting becomes a paid-plan feature.
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
      {
        // Content-hashed widget builds from scripts/build-widget.mjs - safe
        // to cache forever since a new deploy always writes a new filename.
        source: "/widget.:hash.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
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
