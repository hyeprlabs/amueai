import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";

import { ThemeProvider } from "@/components/theme-provider";
import { NotFoundPage } from "@/components/not-found";
import { siteConfig } from "@/config/site";
import "./(app)/globals.css";

/**
 * The true root `not-found.tsx` — outside every route group.
 *
 * This project has no single shared root layout (it uses the "multiple root
 * layouts via route groups" pattern: `(app)/layout.tsx` and
 * `(payload)/layout.tsx` each supply their own `<html>`/`<body>`). A
 * `not-found.tsx` living *inside* a group only fires for an explicit
 * `notFound()` call from a route already matched within that group — a URL
 * that doesn't match any route at all never enters a group's tree, so it
 * never reaches `(app)/not-found.tsx` either. This file is Next's documented
 * catch-all for exactly that case, and per that same pattern it supplies its
 * own minimal `<html>`/`<body>` rather than inheriting one.
 *
 * Deliberately light on providers: no Clerk, no toast/tooltip context, none
 * of which `<NotFoundPage>` needs. `ThemeProvider` stays so dark mode still
 * renders correctly on this one boundary.
 */
export const metadata: Metadata = {
  title: `Page not found | ${siteConfig.name}`,
  description: "The page you are looking for does not exist or has been moved.",
  robots: { index: false, follow: true },
};

export default function RootNotFound() {
  return (
    <html
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}
      lang={siteConfig.language}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <NotFoundPage />
        </ThemeProvider>
      </body>
    </html>
  );
}
