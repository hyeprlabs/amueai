"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { RotateCwIcon } from "lucide-react";

import { FullWidthDivider } from "@/components/full-width-divider";
import { Background } from "@/components/ui/bg";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="relative w-full overflow-hidden px-4 md:h-screen">
      <Background />

      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x *:px-6">
        <div className="flex flex-col space-y-6">
          <div className="space-y-1">
            <h1 className="font-semibold text-xl tracking-wide">Something went wrong</h1>
            <p className="text-base text-muted-foreground">
              An unexpected error occurred. Try again, and if it keeps happening, reach out to
              support.
            </p>
          </div>
        </div>

        <div className="relative my-6 flex size-full flex-col gap-4 py-8">
          <FullWidthDivider position="top" />

          <Button
            className="w-full"
            onClick={
              // Attempt to recover by re-fetching and re-rendering the segment
              () => retry()
            }
          >
            <RotateCwIcon />
            Try again
          </Button>

          <Button
            className="w-full"
            nativeButton={false}
            render={<a href="mailto:amueai@hyeprlabs.com" />}
            variant="outline"
          >
            Support
          </Button>

          <FullWidthDivider position="bottom" />
        </div>

        <p className="text-center text-muted-foreground text-sm">
          {error.digest ? (
            <>
              Error reference: <code>{error.digest}</code>
            </>
          ) : (
            "If the problem persists, please contact support."
          )}
        </p>
      </div>
    </div>
  );
}
