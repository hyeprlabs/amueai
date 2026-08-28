import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { companyLinks, companyLinks2, featureLinks } from "@/components/nav-links";
import { ComingSoonBadge, LinkItem } from "@/components/sheard";

export function DesktopNav() {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem className="bg-transparent">
          <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent data-popup-open:bg-transparent data-popup-open:hover:bg-transparent">
            Features
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-muted/50 p-1.5 dark:bg-background rounded-lg">
            <div className="rounded-lg grid w-lg grid-cols-2 gap-2 border bg-popover p-2 shadow">
              {featureLinks.map((item, i) => (
                <NavigationMenuLink
                  key={`item-${item.label}-${i}`}
                  render={<LinkItem {...item} />}
                />
              ))}
            </div>
            <div className="p-2">
              <p className="text-muted-foreground text-sm">
                Interested?{" "}
                <span aria-disabled="true" className="cursor-not-allowed font-medium opacity-50">
                  Schedule a demo (soon)
                </span>
              </p>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent data-popup-open:bg-transparent data-popup-open:hover:bg-transparent">
            Company
          </NavigationMenuTrigger>
          <NavigationMenuContent className="bg-muted/50 p-1.5 dark:bg-background rounded-lg">
            <div className="grid w-lg grid-cols-2 gap-2">
              <div className="rounded-lg space-y-2 border bg-popover p-2 shadow">
                {companyLinks.map((item, i) => (
                  <NavigationMenuLink
                    key={`item-${item.label}-${i}`}
                    render={<LinkItem {...item} />}
                  />
                ))}
              </div>
              <div className="space-y-2 p-3">
                {companyLinks2.map((item, i) =>
                  item.isComingSoon ? (
                    // Mirrors NavigationMenuLink's own sizing so a disabled row
                    // sits at exactly the same text and icon scale as a live one.
                    <div
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-2 rounded-lg p-2 text-muted-foreground text-sm opacity-50 [&_svg:not([class*='size-'])]:size-4"
                      key={`item-${item.label}-${i}`}
                    >
                      {item.icon}
                      {item.label}
                      <ComingSoonBadge />
                    </div>
                  ) : (
                    <NavigationMenuLink href={item.href} key={`item-${item.label}-${i}`}>
                      {item.icon}
                      {item.label}
                    </NavigationMenuLink>
                  ),
                )}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuLink
          className="px-4 hover:bg-transparent focus:bg-transparent"
          href="/pricing"
        >
          Pricing
        </NavigationMenuLink>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
