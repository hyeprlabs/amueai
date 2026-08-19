"use client";

import Link from "next/link";
import { ClerkLoaded, Show, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function HeaderActions() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ClerkLoaded>
      <div className="hidden items-center gap-2 md:flex">
        <Show when="signed-out">
          <div className="fade-in flex animate-in items-center gap-2 duration-300 ease-out">
            <Button
              nativeButton={false}
              render={<Link href="/sign-in" />}
              size="sm"
              variant="outline"
            >
              Sign In
            </Button>
            <Button nativeButton={false} render={<Link href="/sign-up" />} size="sm">
              Get Started
            </Button>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="fade-in flex animate-in items-center gap-2 duration-300 ease-out">
            <Button
              nativeButton={false}
              render={<Link href="/overview" />}
              size="sm"
              variant="outline"
            >
              Dashboard
            </Button>
            <UserButton />
          </div>
        </Show>
      </div>
    </ClerkLoaded>
  );
}
