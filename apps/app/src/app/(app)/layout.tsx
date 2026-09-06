import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Providers
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/toast";
import { PreviewBanner } from "@/components/preview-banner";
import { ConsentManager } from "@/components/consent-manager";

// SEO
import { siteConfig, siteTitle } from "@/config/site";
import { ogImageDescriptor } from "@/lib/og-image";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.publisher }],
  creator: siteConfig.publisher,
  publisher: siteConfig.publisher,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: "/",
    title: siteTitle,
    description: siteConfig.description,
    images: [ogImageDescriptor()],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: siteTitle,
    description: siteConfig.description,
    images: [ogImageDescriptor()],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.language}
      className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ClerkProvider appearance={{ theme: shadcn }}>
              <NuqsAdapter>
                <ConsentManager>
                  <PreviewBanner />
                  {children}
                  <Toaster />
                </ConsentManager>
              </NuqsAdapter>
            </ClerkProvider>
          </TooltipProvider>
        </ThemeProvider>
        {/*
          Not consent-gated: Vercel Web Analytics is cookieless by design
          (Vercel's privacy docs — no persistent identifier, no localStorage,
          visitor hash discarded after 24h, aggregated only). See the comment
          on `ConsentManagerClient` in `components/consent-manager/provider.tsx`
          for why it doesn't go through c15t's `scripts` array either.
        */}
        <Analytics />
      </body>
    </html>
  );
}
