import type { ReactNode } from "react";
import {
  LayoutGridIcon,
  BarChart3Icon,
  BriefcaseIcon,
  BotIcon,
  UsersIcon,
  PlugIcon,
  KeyRoundIcon,
  SettingsIcon,
  CreditCardIcon,
  HelpCircleIcon,
  BookOpenIcon,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    label: "Product",
    items: [
      {
        title: "Overview",
        path: "/overview",
        icon: <LayoutGridIcon />,
      },
      {
        title: "Agents",
        path: "/agents",
        icon: <BotIcon />,
      },
      {
        title: "Analytics",
        path: "/analytics",
        icon: <BarChart3Icon />,
      },
      {
        title: "Projects",
        path: "#/projects",
        icon: <BriefcaseIcon />,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Team",
        path: "#/team",
        icon: <UsersIcon />,
      },
      {
        title: "Integrations",
        path: "#/integrations",
        icon: <PlugIcon />,
      },
      {
        title: "API Keys",
        path: "#/api-keys",
        icon: <KeyRoundIcon />,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: <SettingsIcon />,
      },
      {
        title: "Billing",
        path: "#/billing",
        icon: <CreditCardIcon />,
      },
    ],
  },
];

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Help Center",
    path: "#/help",
    icon: <HelpCircleIcon />,
  },
  {
    title: "Documentation",
    path: "#/documentation",
    icon: <BookOpenIcon />,
  },
];

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) => (item.subItems?.length ? [item, ...item.subItems] : [item])),
  ),
  ...footerNavLinks,
];

/**
 * Real nav paths only ("#/foo" entries are stubs with no page behind them
 * yet, so they can never be "active"). Matches the item's own route or
 * anything nested under it (e.g. "/agents" stays active on "/agents/123").
 */
export function isNavItemActive(itemPath: string | undefined, pathname: string): boolean {
  if (!itemPath || itemPath.startsWith("#")) return false;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** The most specific nav item whose path matches the current route, for the sidebar highlight and header title. */
export function findActiveNavItem(pathname: string): SidebarNavItem | undefined {
  return navLinks
    .filter((item) => isNavItemActive(item.path, pathname))
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))[0];
}

/**
 * Falls back to a title derived from the URL for dashboard pages that
 * aren't in the sidebar nav (e.g. the Clerk-hosted /profile route), so
 * the header always names the page instead of going blank.
 */
export function headerPageTitle(pathname: string): SidebarNavItem | undefined {
  const activeItem = findActiveNavItem(pathname);
  if (activeItem) return activeItem;

  const firstSegment = pathname.split("/").find(Boolean);
  if (!firstSegment) return undefined;

  return { title: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1) };
}
