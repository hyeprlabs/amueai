import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";

// Providers
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "AmueAI",
    template: "%s | AmueAI",
  },
  description: "Building Digital Experiences That Drive Growth",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
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
            <ClerkProvider>
              {children}
              <Toaster />
            </ClerkProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
