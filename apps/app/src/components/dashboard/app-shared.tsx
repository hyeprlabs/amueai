import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BotIcon,
  GaugeIcon,
  HammerIcon,
  HelpCircleIcon,
  BookOpenIcon,
  MessageSquareTextIcon,
  RadioTowerIcon,
  SettingsIcon,
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

/** The sidebar's default face: everything not scoped to one agent. */
export const primaryNavGroups: SidebarNavGroup[] = [
  {
    label: "Product",
    items: [
      {
        title: "Agents",
        path: "/agents",
        icon: <BotIcon />,
      },
      {
        title: "Usage",
        path: "/usage",
        icon: <GaugeIcon />,
      },
    ],
  },
];

/** The agent id from a `/agents/<id>/...` pathname, or undefined on `/agents` itself or elsewhere. */
export function getActiveAgentId(pathname: string): string | undefined {
  return pathname.match(/^\/agents\/([^/]+)(?:\/|$)/)?.[1];
}

/**
 * The sidebar's other face: flat Playground/Build/Analytics/Channels/
 * Settings nav for one agent - no parent "Agents" item, the whole sidebar
 * becomes this agent's nav while you're inside it (paired with the
 * AgentSwitcher rendered above it in AppSidebar). Build is the one item
 * with its own sub-nav (Sources, Embed), expanded via NavGroup's
 * collapsible branch rather than an in-page tab bar.
 */
export function getAgentNavGroups(agentId: string): SidebarNavGroup[] {
  const base = `/agents/${agentId}`;

  return [
    {
      items: [
        { title: "Playground", path: `${base}/playground`, icon: <MessageSquareTextIcon /> },
        {
          title: "Build",
          path: `${base}/build`,
          icon: <HammerIcon />,
          subItems: [
            { title: "Sources", path: `${base}/build/sources` },
            { title: "Embed", path: `${base}/build/embed` },
          ],
        },
        { title: "Analytics", path: `${base}/analytics`, icon: <BarChart3Icon /> },
        { title: "Channels", path: `${base}/channels`, icon: <RadioTowerIcon /> },
        { title: "Settings", path: `${base}/settings`, icon: <SettingsIcon /> },
      ],
    },
  ];
}

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

const navLinks: SidebarNavItem[] = [
  ...primaryNavGroups.flatMap((group) => group.items),
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
