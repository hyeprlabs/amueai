"use client";

import type { ReactNode } from "react";
import { ConsentManagerProvider, ConsentBanner, ConsentDialog } from "@c15t/nextjs";
import { vercelAnalytics } from "@c15t/scripts/vercel-analytics";

import { siteConfig } from "@/config/site";
import { consentManagerTheme } from "./theme";

/**
 * Every optional resource in the app is declared here, whether it's
 * consent-gated or explicitly exempted, so this array stays the single
 * inventory of what runs and why. Add new optional scripts/pixels/embeds
 * here rather than mounting them elsewhere.
 */
const scripts = [
  // Vercel Web Analytics: cookieless by design (Vercel docs — no persistent
  // identifier, no localStorage, visitor hash discarded after 24h,
  // aggregated only, no cross-site tracking). That's the thing ePrivacy
  // consent exists to gate — storing/reading something on the device — so it
  // loads unconditionally rather than waiting on `measurement` consent.
  //
  // This exemption holds only as long as no persistent identifier is ever
  // attached to it. Do not pass `blog-visitor-id` (or any other per-visitor
  // ID) into a custom event here — that would turn an anonymous, 24h-bounded
  // aggregate into a year-long per-visitor trail, which is exactly the kind
  // of tracking that needs consent. Send category/variant labels instead
  // (see `components/marketing/blog/blog-variant-tracking.tsx`).
  { ...vercelAnalytics(), alwaysLoad: true },
];

export function ConsentManagerClient({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: "hosted",
        backendURL: "/api/c15t",
        // Nothing currently gated needs `measurement` as a user-facing
        // toggle — Vercel Analytics is always-on (see `scripts` above) and
        // nothing else uses this category. Add it back here (and to
        // `scripts`) the day a non-anonymous measurement tool shows up.
        consentCategories: ["necessary"],
        scripts,
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
