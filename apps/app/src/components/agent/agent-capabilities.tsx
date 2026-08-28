import {
  CpuIcon,
  LanguagesIcon,
  PencilIcon,
  PlugIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ZapIcon,
  FlaskConicalIcon,
} from "lucide-react";

import { GridPattern } from "@/components/ui/grid-pattern";

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
    <div className="relative overflow-hidden">
      <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute inset-0">
        <GridPattern
          className="absolute inset-0 size-full stroke-foreground/20 opacity-70"
          height={40}
          width={40}
        />
      </div>

      <ul className="relative grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
        {capabilities.map((capability) => (
          <li
            className="flex items-center gap-2.5 bg-background p-4 sm:p-5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-foreground/75"
            key={capability.label}
          >
            {capability.icon}
            <span className="text-balance text-xs sm:text-sm">{capability.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
