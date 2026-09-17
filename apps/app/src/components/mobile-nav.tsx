import Link from "next/link";
import { ClerkLoaded, Show, UserButton } from "@clerk/nextjs";
import React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { companyLinks, companyLinks2, featureLinks } from "@/components/nav-links";
import { LinkItem } from "@/components/sheard";
import { XIcon, MenuIcon } from "lucide-react";

export function MobileNav({ waitlistEnabled }: { waitlistEnabled: boolean }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle menu"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        size="icon"
        variant="outline"
      >
        <div className={cn("transition-all", open ? "scale-100 opacity-100" : "scale-0 opacity-0")}>
          <XIcon />
        </div>
        <div
          className={cn(
            "absolute transition-all",
            open ? "scale-0 opacity-0" : "scale-100 opacity-100",
          )}
        >
          <MenuIcon />
        </div>
      </Button>
      {open && (
        <Portal className="top-14">
          <PortalBackdrop />
          <div
            className={cn(
              "size-full overflow-y-auto p-4",
              "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
            )}
            data-slot={open ? "open" : "closed"}
          >
            <div className="flex w-full flex-col gap-y-2">
              <span className="text-sm">Features</span>
              {featureLinks.map((link) => (
                <LinkItem
                  className="rounded-lg p-2 active:bg-muted dark:active:bg-muted/50"
                  key={`feature-${link.label}`}
                  {...link}
                />
              ))}
              <span className="text-sm">Company</span>
              {companyLinks.map((link) => (
                <LinkItem
                  className="rounded-lg p-2 active:bg-muted dark:active:bg-muted/50"
                  key={`company-${link.label}`}
                  {...link}
                />
              ))}
              {companyLinks2.map((link) => (
                <LinkItem
                  className="rounded-lg p-2 active:bg-muted dark:active:bg-muted/50"
                  key={`company-${link.label}`}
                  {...link}
                />
              ))}
            </div>
            {waitlistEnabled ? (
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  className="w-full"
                  nativeButton={false}
                  onClick={() => setOpen(false)}
                  render={<Link href="/" />}
                >
                  Join Waitlist
                </Button>
              </div>
            ) : (
              <ClerkLoaded>
                <div className="mt-5 flex flex-col gap-2">
                  <Show when="signed-out">
                    <Button
                      className="w-full"
                      nativeButton={false}
                      onClick={() => setOpen(false)}
                      render={<Link href="/sign-in" />}
                      variant="outline"
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full"
                      nativeButton={false}
                      onClick={() => setOpen(false)}
                      render={<Link href="/sign-up" />}
                    >
                      Get Started
                    </Button>
                  </Show>

                  <Show when="signed-in">
                    <div className="flex items-center gap-2">
                      <Button
                        className="w-full"
                        nativeButton={false}
                        onClick={() => setOpen(false)}
                        render={<Link href="/agents" />}
                        variant="outline"
                      >
                        Dashboard
                      </Button>
                      <UserButton />
                    </div>
                  </Show>
                </div>
              </ClerkLoaded>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}
