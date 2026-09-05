"use client";

import type { ReactNode } from "react";
import { ConsentManagerProvider, ConsentBanner, ConsentDialog } from "@c15t/nextjs";
import { vercelAnalytics } from "@c15t/scripts/vercel-analytics";

import { siteConfig } from "@/config/site";
import { consentManagerTheme } from "./theme";

/**
 * Every optional resource in the app is declared here so it only loads once
 * the matching consent category is granted. Add new optional
 * scripts/pixels/embeds to this array rather than mounting them elsewhere -
 * that's what keeps them gated behind the banner instead of racing it.
 */
const scripts = [
  // Vercel Web Analytics beacon (`/_vercel/insights/*`). Replaces the
  // always-on `<Analytics />` component from `@vercel/analytics/next`.
  vercelAnalytics(),
];

export function ConsentManagerClient({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: "hosted",
        backendURL: "/api/c15t",
        consentCategories: ["necessary", "measurement"],
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
