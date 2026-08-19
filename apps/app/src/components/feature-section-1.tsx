import { cn } from "@/lib/utils";
import type React from "react";
import { GridPattern } from "@/components/ui/grid-pattern";
import {
  ZapIcon,
  CpuIcon,
  HeadsetIcon,
  PencilIcon,
  Settings2Icon,
  UserPlusIcon,
} from "lucide-react";

type FeatureType = {
  title: string;
  icon: React.ReactNode;
  description: string;
};

export function FeatureSection1() {
  return (
    <div className="mb-12 lg:mb-24 mx-auto w-full max-w-5xl border-t">
      <div className="mx-auto max-w-3xl text-center my-6">
        <h2 className="text-balance font-medium text-2xl md:text-4xl lg:text-5xl">
          Train. Deploy. Convert.
        </h2>
        <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
          Everything you need to turn your website into a 24/7 support and sales agent.
        </p>
      </div>

      <div className="overflow-hidden border-y">
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard feature={feature} key={feature.title} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureCard({
  feature,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  feature: FeatureType;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-background p-6", className)} {...props}>
      <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
        <GridPattern
          className="absolute inset-0 size-full stroke-foreground/20 opacity-80"
          height={40}
          width={40}
          x={20}
        />
      </div>
      <div className="[&_svg]:size-6 [&_svg]:text-foreground/75">{feature.icon}</div>
      <h3 className="mt-10 text-sm md:text-base">{feature.title}</h3>
      <p className="relative z-20 mt-2 font-light text-muted-foreground text-xs">
        {feature.description}
      </p>
    </div>
  );
}

const features: FeatureType[] = [
  {
    title: "Instant Answers",
    icon: <ZapIcon />,
    description: "Real-time, human-like responses powered by the latest AI models.",
  },
  {
    title: "Powerful AI Models",
    icon: <CpuIcon />,
    description: "Power your agent with GPT-5, Claude, or the model that fits you best.",
  },
  {
    title: "Human Handoff",
    icon: <HeadsetIcon />,
    description: "Escalate tricky conversations to your team the moment it matters.",
  },
  {
    title: "Custom Branding",
    icon: <PencilIcon />,
    description: "Match your website's colors, logo, and tone in every conversation.",
  },
  {
    title: "Agent Actions",
    icon: <Settings2Icon />,
    description: "Let your agent book calls, check orders, and complete real tasks.",
  },
  {
    title: "Lead Capture",
    icon: <UserPlusIcon />,
    description: "Automatically collect and qualify leads right inside the chat.",
  },
];
