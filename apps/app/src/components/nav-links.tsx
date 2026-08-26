import type { LinkItemType } from "@/components/sheard";
import {
  BotIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  BarChart3Icon,
  PlugIcon,
  CodeIcon,
  UsersIcon,
  StarIcon,
  BriefcaseIcon,
  NewspaperIcon,
  LifeBuoyIcon,
  HistoryIcon,
  MessagesSquareIcon,
  SwordsIcon,
} from "lucide-react";

export const featureLinks: LinkItemType[] = [
  {
    label: "Agent",
    href: "/features/agent",
    description: "Build a custom AI agent trained on your data",
    icon: <BotIcon />,
  },
  {
    label: "Sources",
    href: "/features/sources",
    description: "Train your agent on docs, websites, and files",
    icon: <DatabaseIcon />,
  },
  {
    label: "Playground",
    href: "/features/playground",
    description: "Test and refine your agent before going live",
    icon: <FlaskConicalIcon />,
  },
  {
    label: "Analytics",
    href: "/features/analytics",
    description: "Track conversations and agent performance",
    icon: <BarChart3Icon />,
  },
  {
    label: "Channels",
    href: "/features/channels",
    description: "Deploy to your website, Slack, WhatsApp, and more",
    icon: <PlugIcon />,
  },
  {
    label: "API",
    href: "/features/api",
    description: "Build custom integrations with our API",
    icon: <CodeIcon />,
  },
];

export const companyLinks: LinkItemType[] = [
  {
    label: "About Us",
    href: "/about",
    description: "Learn more about AmueAI and our mission",
    icon: <UsersIcon />,
  },
  {
    label: "Customer Stories",
    href: "/customers",
    description: "See how businesses use AmueAI to support customers",
    icon: <StarIcon />,
  },
  {
    label: "Careers",
    href: "/careers",
    icon: <BriefcaseIcon />,
    description: "Join the team building AmueAI",
  },
];

export const companyLinks2: LinkItemType[] = [
  {
    label: "Blog",
    href: "/blog",
    icon: <NewspaperIcon />,
  },
  {
    label: "Changelog",
    href: "/changelog",
    icon: <HistoryIcon />,
  },
  {
    label: "Competitors",
    href: "/competitors",
    icon: <SwordsIcon />,
  },
  {
    label: "Community",
    href: "/community",
    icon: <MessagesSquareIcon />,
  },
  {
    label: "Support",
    href: "/support",
    icon: <LifeBuoyIcon />,
  },
];
