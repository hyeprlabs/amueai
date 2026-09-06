import type { Theme } from "@c15t/nextjs";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const consentManagerTheme: Theme = {
  slots: {
    consentBannerCard: {
      noStyle: true,
      className: cn(
        "relative w-full max-w-lg divide-y overflow-hidden rounded-2xl",
        "bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 dark:ring-foreground/20",
        "p-4",
      ),
    },
    consentBannerTitle: {
      noStyle: true,
      className: "font-medium text-base text-foreground leading-none",
    },
    consentBannerDescription: {
      noStyle: true,
      className: "text-muted-foreground text-sm",
    },
    consentBannerFooterSubGroup: { className: "gap-2" },
    buttonSecondary: { noStyle: true, className: buttonVariants({ variant: "secondary" }) },
    buttonPrimary: { noStyle: true, className: buttonVariants({ variant: "default" }) },
    consentDialogCard: {
      noStyle: true,
      className: cn(
        "rounded-2xl bg-background text-foreground shadow-[0_0_0_1px_var(--border)]",
        "p-4",
      ),
    },
    consentDialogTitle: {
      noStyle: true,
      className: "font-medium text-base text-foreground leading-none tracking-tight",
    },
    consentDialogDescription: {
      noStyle: true,
      className: "text-muted-foreground text-sm",
    },
    consentWidgetAccordion: { noStyle: true, className: "rounded-lg border divide-y" },
    toggle: { className: "data-[state=checked]:bg-primary" },
  },
};
