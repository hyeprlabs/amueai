import Image from "next/image";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { WhitelistForm } from "@/components/marketing/whitelist-form";
import { BorderBeam } from "@/components/ui/border-beam";

export function HeroSection() {
  return (
    <section>
      <div className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-4 md:py-24 lg:py-28">
        {/* X Faded Borders & Shades */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 size-full overflow-hidden">
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>

        <h1
          className={cn(
            "max-w-2xl text-balance text-center text-3xl text-foreground md:text-5xl lg:text-6xl font-pixel-square",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out motion-reduce:animate-none",
          )}
        >
          Custom AI Agents Trained on Your Data
        </h1>

        <p
          className={cn(
            "text-center text-muted-foreground text-sm tracking-wider sm:text-lg",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out motion-reduce:animate-none",
          )}
        >
          Train an AI agent on your content in minutes <br /> to answer questions, capture leads,
          and support customers 24/7.
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in flex-col items-center justify-center gap-2 fill-mode-backwards pt-2 delay-300 duration-500 ease-out motion-reduce:animate-none">
          <p className="text-center font-semibold text-sm">Join the Waitlist</p>
          <WhitelistForm />
        </div>
      </div>
      <div className="relative">
        <BorderBeam
          colorFrom="rgba(255,255,255,0.35)"
          colorTo="rgba(255,255,255,0.35)"
          duration={20}
          size={120}
        />
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        {/*
          Both variants stay lazy on purpose. The theme is only known in the
          browser, so preloading either one would fetch a screenshot half the
          visitors never see; lazy loading skips whichever variant CSS hides.
        */}
        <div className="overflow-hidden *:pointer-events-none *:aspect-auto *:select-none">
          <Image
            alt={`The ${siteConfig.name} dashboard showing an AI agent answering customer questions`}
            className="dark:hidden"
            height={992}
            sizes="(min-width: 1024px) 1024px, 100vw"
            src="/bg-light.png"
            width={1586}
          />
          <Image
            alt={`The ${siteConfig.name} dashboard showing an AI agent answering customer questions`}
            className="hidden dark:block"
            height={992}
            sizes="(min-width: 1024px) 1024px, 100vw"
            src="/bg-dark.png"
            width={1586}
          />
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
