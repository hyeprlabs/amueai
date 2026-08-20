import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

import { assertBuildEnv } from "./src/lib/assert-env";

assertBuildEnv();

const nextConfig: NextConfig = {
  // Nothing gains from advertising the framework in every response header.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.github.dev"],
    },
  },
  images: {
    // Serve modern formats so Largest Contentful Paint stays cheap.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "storage.efferd.com", pathname: "/**" }],
  },
};

export default withPayload(nextConfig);
