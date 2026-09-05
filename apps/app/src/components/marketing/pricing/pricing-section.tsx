"use client";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { type FREQUENCY, FrequencyToggle } from "@/components/marketing/pricing/frequency-toggle";
import { type Plan, plans } from "@/components/marketing/pricing/plans";
import { CheckCircle2 } from "lucide-react";

export function PricingSection() {
  const [frequency, setFrequency] = React.useState<"monthly" | "yearly">("monthly");

  return (
    <section className="relative mx-auto my-12 lg:my-24 w-full max-w-5xl">
      <FullWidthDivider position="top" />

      <div className="flex flex-col items-center gap-4 px-4 py-6 text-center md:py-8">
        <div className="max-w-xl space-y-2">
          <h2 className="font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
            Plans That Scale with You
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Whether you’re just starting out or growing fast, our flexible pricing has you covered
            with no hidden costs.
          </p>
        </div>

        <FrequencyToggle frequency={frequency} setFrequency={setFrequency} />
      </div>

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider position="top" />
        <FullWidthDivider position="bottom" />

        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard frequency={frequency} key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

type PricingCardProps = React.ComponentProps<"div"> & {
  plan: Plan;
  frequency?: FREQUENCY;
};

export function PricingCard({
  plan,
  className,
  frequency = "monthly",
  ...props
}: PricingCardProps) {
  return (
    <div
      className={cn("relative flex w-full flex-col bg-background", className)}
      key={plan.name}
      {...props}
    >
      <div className="border-b p-6">
        <AnimatePresence>
          {frequency === "yearly" && plan.price.monthly > plan.price.yearly && (
            <motion.div
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="discount-badge"
              layout
              transition={{ duration: 0.15 }}
            >
              {Math.round(((plan.price.monthly - plan.price.yearly) / plan.price.monthly) * 100)}%
              off
            </motion.div>
          )}
        </AnimatePresence>

        <div className="font-medium text-lg">{plan.name}</div>
        <p className="font-normal text-muted-foreground text-sm">{plan.info}</p>
        <h3 className="mt-6 mb-1 flex w-max items-end gap-1">
          <NumberFlow
            className="font-extrabold text-3xl [&::part(suffix)]:font-normal [&::part(suffix)]:text-base [&::part(suffix)]:text-muted-foreground"
            format={{
              style: "currency",
              currency: "USD",
              notation: "compact",
            }}
            suffix="/month"
            value={plan.price[frequency]}
          />
        </h3>
        <p className="font-normal text-muted-foreground text-xs">billed {frequency}</p>
      </div>
      <div className="space-y-3 px-6 py-6 text-muted-foreground text-sm">
        {plan.features.map((feature) => (
          <div className="flex items-center gap-2" key={feature}>
            <CheckCircle2 className="size-3.5 text-foreground" />
            <p>{feature}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto w-full border-t p-3">
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link href={plan.btn.href} />}
          variant="outline"
        >
          {plan.btn.text}
        </Button>
      </div>
    </div>
  );
}
