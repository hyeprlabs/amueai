import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Background } from "@/components/ui/bg";
import { HomeIcon } from "lucide-react";

/**
 * Where-to-look-next links for a visitor (or an agent) that hit a dead URL.
 * Kept in sync with the real, always-current indexes rather than a fixed
 * site map, so this list can't drift out of date.
 */
const recoveryLinks = [
  { href: "/sitemap.xml", label: "Sitemap" },
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/blog", label: "Blog" },
] as const;

export function NotFoundPage() {
  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden">
      <Background />

      <div className="flex h-screen items-center border-x">
        <div>
          <FullWidthDivider />
          <Empty>
            <EmptyHeader>
              <EmptyTitle className="font-black font-mono text-8xl">404</EmptyTitle>
              <EmptyDescription>
                The page you&apos;re looking for doesn&apos;t exist or has been moved. Try the home
                page, or one of these:
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link href="/" />} nativeButton={false}>
                <HomeIcon />
                Go Home
              </Button>
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
                {recoveryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="underline underline-offset-4 hover:text-primary"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </EmptyContent>
          </Empty>
          <FullWidthDivider />
        </div>
      </div>
    </div>
  );
}
