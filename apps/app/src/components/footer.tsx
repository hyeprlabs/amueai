import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons/github-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Logo } from "@/components/logo";
import { LegalDropdown } from "@/components/legal-dropdown";
import { Button } from "@/components/ui/button";
import { FullWidthDivider } from "@/components/full-width-divider";

export function Footer() {
  return (
    <footer
      className={cn(
        "relative mx-auto lg:mx-12 lg:border-x",
        "dark:bg-[radial-gradient(35%_80%_at_15%_0%,--theme(--color-foreground/.1),transparent)]",
      )}
    >
      <FullWidthDivider position="top" />
      <div className="grid max-w-5xl grid-cols-6 gap-6 p-4">
        <div className="col-span-6 flex flex-col gap-4 pt-5 md:col-span-4">
          <Link aria-label={`${siteConfig.name} home`} className="w-max" href="/">
            <Logo className="h-5" />
          </Link>
          <p className="max-w-sm text-balance text-muted-foreground text-sm">
            {siteConfig.description}
          </p>
          <div className="flex gap-2">
            {socialLinks.map((item, index) => (
              <Button
                aria-label={`${siteConfig.name} on ${item.label}`}
                key={`social-${item.link}-${index}`}
                size="icon"
                variant="outline"
                render={<a href={item.link} rel="noopener noreferrer" target="_blank" />}
                nativeButton={false}
              >
                {item.icon}
              </Button>
            ))}
          </div>
          <LegalDropdown />
        </div>
        <div className="col-span-3 w-full md:col-span-1">
          <span className="text-muted-foreground text-xs">Resources</span>
          <div className="mt-2 flex flex-col gap-2">
            {resources.map(({ href, title }) => (
              <Link className="w-max text-sm hover:underline" href={href} key={title}>
                {title}
              </Link>
            ))}
          </div>
        </div>
        <div className="col-span-3 w-full md:col-span-1">
          <span className="text-muted-foreground text-xs">Company</span>
          <div className="mt-2 flex flex-col gap-2">
            {company.map(({ href, title }) => (
              <Link className="w-max text-sm hover:underline" href={href} key={title}>
                {title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <FullWidthDivider />
      <div className="flex items-center justify-center gap-2 py-4">
        <p className="text-center font-light text-muted-foreground text-sm font-mono">
          &copy; {new Date().getFullYear()} AmueAI, All rights reserved
        </p>
      </div>
    </footer>
  );
}

// Only pages that actually exist today, sorted alphabetically within each column.
const company = [
  {
    title: "About Us",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
];

const resources = [
  {
    title: "Agent",
    href: "/features/agent",
  },
  {
    title: "Blog",
    href: "/blog",
  },
  {
    title: "Changelog",
    href: "/changelog",
  },
  {
    title: "Channels",
    href: "/features/channels",
  },
  {
    title: "Competitors",
    href: "/competitors",
  },
];

const socialLinks = [
  {
    label: "GitHub",
    icon: <GithubIcon />,
    link: siteConfig.links.github,
  },
  {
    label: "Instagram",
    icon: <InstagramIcon />,
    link: siteConfig.links.instagram,
  },
  {
    label: "X",
    icon: <XIcon />,
    link: siteConfig.links.x,
  },
];
