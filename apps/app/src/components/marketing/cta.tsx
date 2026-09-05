import { DecorIcon } from "@/components/decor-icon";
import { WhitelistForm } from "@/components/marketing/whitelist-form";

export function CallToAction() {
  return (
    <div className="mb-12 lg:mb-24 relative mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-y-4 border-y px-4 py-8 dark:bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.08),transparent)]">
      <DecorIcon className="size-4" position="top-left" />
      <DecorIcon className="size-4" position="top-right" />
      <DecorIcon className="size-4" position="bottom-left" />
      <DecorIcon className="size-4" position="bottom-right" />

      <div className="absolute top-0 left-1/2 -z-10 h-full border-l border-dashed" />

      <h2 className="text-center font-semibold text-xl md:text-3xl">Join the Waitlist</h2>
      <p className="text-balance text-center font-medium text-muted-foreground text-sm md:text-base">
        Sign up with your email and we’ll let you know the moment you can get in.
      </p>

      <WhitelistForm />
    </div>
  );
}
