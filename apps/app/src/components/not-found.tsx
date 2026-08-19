import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeIcon } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex w-full items-center justify-center overflow-hidden">
      <div className="flex h-screen items-center border-x">
        <div>
          <FullWidthDivider />
          <Empty>
            <EmptyHeader>
              <EmptyTitle className="font-black font-mono text-8xl">
                404
              </EmptyTitle>
              <EmptyDescription>
                The page you&apos;re looking for doesn&apos;t exist or has
                been moved.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<a href="/" />} nativeButton={false}>
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
