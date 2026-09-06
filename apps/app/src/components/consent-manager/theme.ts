import type { Theme } from "@c15t/nextjs";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const card = cn(
  "w-full max-w-lg overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10",
  "p-(--card-spacing) [--card-spacing:--spacing(4)]",
);

const cardTitle = "font-medium text-base leading-snug text-foreground";
const cardDescription = "text-muted-foreground text-sm";
const cardFooter = "flex flex-wrap items-center gap-2 pt-(--card-spacing)";
const overlay = "bg-foreground/10 backdrop-blur-xs dark:bg-foreground/20";

export const consentManagerTheme: Theme = {
  slots: {
    consentBannerCard: { noStyle: true, className: card },
    consentBannerTitle: { noStyle: true, className: cardTitle },
    consentBannerDescription: { noStyle: true, className: cardDescription },
    consentBannerFooter: { noStyle: true, className: cardFooter },
    consentBannerFooterSubGroup: { className: "gap-2" },
    consentBannerOverlay: { noStyle: true, className: overlay },

    consentDialogCard: { noStyle: true, className: card },
    consentDialogTitle: { noStyle: true, className: cardTitle },
    consentDialogDescription: { noStyle: true, className: cardDescription },
    consentDialogFooter: { noStyle: true, className: cardFooter },
    consentDialogOverlay: { noStyle: true, className: overlay },

    consentWidgetAccordion: { noStyle: true, className: "divide-y rounded-lg border" },
    consentWidgetFooterSubGroup: { className: "gap-2" },

    buttonPrimary: { noStyle: true, className: buttonVariants({ variant: "default" }) },
    buttonSecondary: { noStyle: true, className: buttonVariants({ variant: "secondary" }) },

    toggle: {
      noStyle: true,
      className: cn(
        "inline-flex h-4.5 w-8 shrink-0 items-center rounded-full border border-transparent transition-all",
        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/50",
      ),
    },
  },
};
