import {
  CpuIcon,
  FlaskConicalIcon,
  LanguagesIcon,
  PencilIcon,
  PlugIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ZapIcon,
} from "lucide-react";

import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SectionHeading } from "@/components/marketing/page-hero";

/** Deliberately label-only: the bands above already made the argument. */
const capabilities = [
  { label: "Instant answers", icon: <ZapIcon /> },
  { label: "Your choice of model", icon: <CpuIcon /> },
  { label: "Won't invent answers", icon: <ShieldCheckIcon /> },
  { label: "Your branding", icon: <PencilIcon /> },
  { label: "Lead capture", icon: <UserPlusIcon /> },
  { label: "90+ languages", icon: <LanguagesIcon /> },
  { label: "Test playground", icon: <FlaskConicalIcon /> },
  { label: "Every channel", icon: <PlugIcon /> },
];

export function AgentCapabilities() {
  return (
    <section className="mb-12 lg:mb-24">
      <SectionHeading
        description="The rest of what your agent can do, out of the box."
        title="And everything else"
      />

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <ul className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
          {capabilities.map((capability) => (
            <li
              className="flex items-center gap-2.5 bg-background p-4 md:p-6 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-foreground/75"
              key={capability.label}
            >
              {capability.icon}
              <span className="text-balance text-xs md:text-sm">{capability.label}</span>
            </li>
          ))}
        </ul>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
