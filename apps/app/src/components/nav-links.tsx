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
  MailIcon,
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
    isComingSoon: true,
  },
  {
    label: "Playground",
    href: "/features/playground",
    description: "Test and refine your agent before going live",
    icon: <FlaskConicalIcon />,
    isComingSoon: true,
  },
  {
    label: "Analytics",
    href: "/features/analytics",
    description: "Track conversations and agent performance",
    icon: <BarChart3Icon />,
    isComingSoon: true,
  },
  {
    label: "Channels",
    href: "/features/channels",
    description: "Deploy to your website, Slack, WhatsApp, and more",
    icon: <PlugIcon />,
    isComingSoon: true,
  },
  {
    label: "API",
    href: "/features/api",
    description: "Build custom integrations with our API",
    icon: <CodeIcon />,
    isComingSoon: true,
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
    label: "Contact",
    href: "/contact",
    description: "Get in touch with the AmueAI team",
    icon: <MailIcon />,
  },
  {
    label: "Customer Stories",
    href: "/customers",
    description: "See how businesses use AmueAI to support customers",
    icon: <StarIcon />,
    isComingSoon: true,
  },
  {
    label: "Careers",
    href: "/careers",
    icon: <BriefcaseIcon />,
    description: "Join the team building AmueAI",
    isComingSoon: true,
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
    isComingSoon: true,
  },
  {
    label: "Support",
    href: "/support",
    icon: <LifeBuoyIcon />,
    isComingSoon: true,
  },
];
