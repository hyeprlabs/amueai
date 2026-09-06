"use client";

import type { ReactNode } from "react";
import { ConsentManagerProvider, ConsentBanner, ConsentDialog } from "@c15t/nextjs";

import { siteConfig } from "@/config/site";
import { consentManagerTheme } from "./theme";

export function ConsentManagerClient({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: "hosted",
        backendURL: "/api/c15t",
        consentCategories: ["necessary", "functionality", "experience", "measurement", "marketing"],
        theme: consentManagerTheme,
        legalLinks: {
          privacyPolicy: { href: "/legal/privacy-policy", target: "_self" },
          cookiePolicy: { href: "/legal/cookie-policy", target: "_self" },
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
