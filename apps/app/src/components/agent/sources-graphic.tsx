"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { FileTextIcon, GlobeIcon, MessagesSquareIcon, TypeIcon } from "lucide-react";

import { accents } from "@/components/agent/accent";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

const sources = [
  { label: "Website", icon: <GlobeIcon /> },
  { label: "PDF", icon: <FileTextIcon /> },
  { label: "Text", icon: <TypeIcon /> },
  { label: "Q&A", icon: <MessagesSquareIcon /> },
];

const accent = accents.blue;
const HOLD_MS = 1200;

export function SourcesGraphic() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setActive((current) => (current + 1) % sources.length), HOLD_MS);
    return () => clearTimeout(timer);
  }, [active, reduced]);

  return (
    <div className="flex w-full gap-2 sm:gap-3">
      {sources.map((source, index) => (
        <motion.div
          key={source.label}
          animate={{
            scale: !reduced && index === active ? 1.1 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <IconTile
            aria-hidden="true"
            className={cn(
              "transition-colors duration-300",
              !reduced && index === active && accent.text,
            )}
            size="sm"
            variant="frame"
          >
            {source.icon}
          </IconTile>
        </motion.div>
      ))}
    </div>
  );
}
