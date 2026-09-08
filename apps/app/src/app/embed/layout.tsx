import type { Metadata } from "next";

import "../(app)/globals.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: LayoutProps<"/embed">) {
  return (
    <html className="dark" lang="en">
      <body className="h-dvh overflow-hidden bg-transparent text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
