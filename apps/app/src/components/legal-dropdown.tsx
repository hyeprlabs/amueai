"use client";

import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const legalLinks = [
  { title: "Imprint", href: "/legal/imprint" },
  { title: "Privacy Policy", href: "/legal/privacy-policy" },
  { title: "Terms of Service", href: "/legal/terms-of-service" },
  { title: "Right of Withdrawal", href: "/legal/withdrawal" },
  { title: "Data Processing Agreement", href: "/legal/dpa" },
];

export function LegalDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="group w-max" size="sm" variant="outline">
            Legal
            <ChevronDownIcon
              className="transition-transform duration-200 group-data-popup-open:rotate-180"
              data-icon="inline-end"
            />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56" sideOffset={8}>
        {legalLinks.map((item) => (
          <DropdownMenuItem key={item.href} render={<a href={item.href} />}>
            {item.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
