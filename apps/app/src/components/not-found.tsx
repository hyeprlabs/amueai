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
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link href="/" />} nativeButton={false}>
                <HomeIcon />
                Go Home
              </Button>
            </EmptyContent>
          </Empty>
          <FullWidthDivider />
        </div>
      </div>
    </div>
  );
}
