"use client";

import { motion } from "motion/react";
import { memo } from "react";

import { cn } from "@/lib/utils";

export type ShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
};

function ShimmerComponent({
  children,
  as: Component = "span",
  className,
  duration = 2,
  spread = 2,
}: ShimmerProps) {
  const MotionComponent = motion.create(Component);
  const dynamicSpread = children.length * spread;

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[--base-color:var(--color-muted-foreground)] [--base-gradient-color:var(--color-foreground)]",
        "[background-repeat:no-repeat,padding-box]",
        className,
      )}
      style={
        {
          backgroundImage: "var(--bg), linear-gradient(var(--base-color), var(--base-color))",
          "--bg": `linear-gradient(90deg, transparent calc(50% - var(--spread)), var(--base-gradient-color), transparent calc(50% + var(--spread)))`,
          "--spread": `${dynamicSpread}px`,
          backgroundPosition: "0% center",
        } as React.CSSProperties
      }
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration,
        ease: "linear",
      }}
    >
      {children}
    </MotionComponent>
  );
}

export const Shimmer = memo(ShimmerComponent);
