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
