"use client";

import type { ReactNode } from "react";
import { ConsentManagerProvider, ConsentBanner, ConsentDialog } from "@c15t/nextjs";

import { siteConfig } from "@/config/site";
import { consentManagerTheme } from "./theme";

/**
 * Vercel Web Analytics is mounted independently in the root layout, not
 * through c15t's `scripts` array. c15t's `alwaysLoad` flag is documented for
 * vendors with their own internal consent API (GTM Consent Mode is the
 * example c15t gives) so it can call `onConsentChange` to signal that API —
 * Vercel Analytics has no such API, nothing to call. Routing it through the
 * gated script loader with `alwaysLoad` and no `onConsentChange` is a
 * documented misuse of that flag, not just an unused option.
 *
 * The actual reason it doesn't need gating is unrelated to that mechanism:
 * Vercel's own privacy docs describe it as cookieless (no persistent
 * identifier, no localStorage, a visitor hash discarded after 24h,
 * aggregated only, no cross-site tracking) - the thing ePrivacy consent
 * exists to gate. See `apps/app/src/app/(app)/layout.tsx` for where it's
 * mounted.
 *
 * That exemption holds only as long as no persistent identifier is ever
 * attached to it. Do not pass `blog-visitor-id` (or any other per-visitor
 * ID) into a custom event - that would turn an anonymous, 24h-bounded
 * aggregate into a year-long per-visitor trail, which is exactly the kind of
 * tracking that needs consent. Send category/variant labels instead (see
 * `components/marketing/blog/blog-variant-tracking.tsx`).
 */
export function ConsentManagerClient({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: "hosted",
        backendURL: "/api/c15t",
        // Nothing currently gated needs `measurement` as a user-facing
        // toggle. Add it back here the day a non-anonymous measurement tool
        // shows up.
        consentCategories: ["necessary"],
        theme: consentManagerTheme,
        legalLinks: {
          privacyPolicy: { href: "/legal/privacy-policy", target: "_self" },
        },
        overrides: {
          language: siteConfig.language,
        },
      }}
    >
      <ConsentBanner />
      <ConsentDialog />
      {children}
    </ConsentManagerProvider>
  );
}
