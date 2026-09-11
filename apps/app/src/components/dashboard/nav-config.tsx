import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BotIcon,
  GaugeIcon,
  HammerIcon,
  MessageSquareTextIcon,
  RadioTowerIcon,
  SettingsIcon,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const primaryNavGroups: SidebarNavGroup[] = [
  {
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

export function getActiveAgentId(pathname: string): string | undefined {
  return pathname.match(/^\/agents\/([^/]+)(?:\/|$)/)?.[1];
}

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

export function getAgentSubPath(pathname: string, agentId: string): string {
  const base = `/agents/${agentId}`;
  const tabs = getAgentNavGroups(agentId).flatMap((group) =>
    group.items.flatMap((item) => [item, ...(item.subItems ?? [])]),
  );
  const knownPaths = tabs.map((item) => item.path).filter((path): path is string => Boolean(path));

  const match = knownPaths
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];

  return match ? match.slice(base.length) : "/playground";
}

const navLinks: SidebarNavItem[] = primaryNavGroups.flatMap((group) => group.items);

export function isNavItemActive(itemPath: string | undefined, pathname: string): boolean {
  if (!itemPath || itemPath.startsWith("#")) return false;
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function findActiveNavItem(pathname: string): SidebarNavItem | undefined {
  return navLinks
    .filter((item) => isNavItemActive(item.path, pathname))
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))[0];
}

export function headerPageTitle(pathname: string): SidebarNavItem | undefined {
  const activeItem = findActiveNavItem(pathname);
  if (activeItem) return activeItem;

  const firstSegment = pathname.split("/").find(Boolean);
  if (!firstSegment) return undefined;

  return { title: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1) };
}
