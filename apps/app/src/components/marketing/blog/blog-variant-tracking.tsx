"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

/**
 * Fires a Vercel Analytics custom event naming which `/blog` A/B variant
 * rendered, so variant performance can be compared in the dashboard.
 *
 * Deliberately takes only "A" | "B", never `blog-visitor-id` (the sticky
 * bucketing cookie from `proxy.ts`) or any other per-visitor identifier -
 * see the comment on `vercelAnalytics()` in
 * `components/consent-manager/provider.tsx` for why attaching a persistent
 * ID here would undo the anonymity Vercel Analytics is exempted from
 * consent on.
 */
export function BlogVariantTracking({ variant }: { variant: "A" | "B" }) {
  useEffect(() => {
    track("blog_variant_view", { variant });
    // Fire once per page load — `variant` doesn't change without a navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
