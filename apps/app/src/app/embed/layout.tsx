import type { Metadata } from "next";

import "../globals.css";

// The widget iframe is its own top-level route segment (sibling to the
// (app) dashboard, not nested inside it), so it needs its own root
// layout - and deliberately a minimal one: no Clerk, no dashboard chrome,
// nothing that assumes a signed-in session, since visitors never sign in.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: LayoutProps<"/embed">) {
  return (
    <html lang="en">
      <body className="h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
