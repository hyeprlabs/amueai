"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingsTabs = [
  { href: "/settings", label: "General" },
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings/billing", label: "Billing" },
] as const;

export function SettingsTabs() {
  const pathname = usePathname() ?? "/settings";
  const activeTab =
    settingsTabs.findLast(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
      ?.href ?? settingsTabs[0].href;

  return (
    <Tabs aria-label="Settings navigation" className="w-fit" value={activeTab}>
      <TabsList>
        {settingsTabs.map((tab) => (
          <TabsTrigger
            key={tab.href}
            nativeButton={false}
            render={
              <Link aria-current={activeTab === tab.href ? "page" : undefined} href={tab.href} />
            }
            value={tab.href}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
