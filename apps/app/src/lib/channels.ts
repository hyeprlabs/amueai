import {
  AtSignIcon,
  GlobeIcon,
  HashIcon,
  MailIcon,
  MessageCircleIcon,
  SendIcon,
  type LucideIcon,
} from "lucide-react";

export type Channel = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge: "Included" | "Coming soon";
};

/**
 * Deployment channels shown in both the /new onboarding wizard and each
 * agent's Channels tab. MVP-only: Website widget is the one real channel
 * (the embed script), everything else is a placeholder with no backing
 * integration yet - shown so the roadmap is visible, not to promise
 * functionality that isn't there.
 */
export const CHANNELS: Channel[] = [
  {
    id: "website",
    label: "Website widget",
    description: "A chat bubble embedded on your site.",
    icon: GlobeIcon,
    badge: "Included",
  },
  {
    id: "slack",
    label: "Slack",
    description: "Answer questions inside Slack channels.",
    icon: HashIcon,
    badge: "Coming soon",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Chat with customers on WhatsApp.",
    icon: MessageCircleIcon,
    badge: "Coming soon",
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Reply to Instagram DMs automatically.",
    icon: AtSignIcon,
    badge: "Coming soon",
  },
  {
    id: "messenger",
    label: "Messenger",
    description: "Connect to Facebook Messenger.",
    icon: SendIcon,
    badge: "Coming soon",
  },
  {
    id: "email",
    label: "Email",
    description: "Draft replies to incoming support emails.",
    icon: MailIcon,
    badge: "Coming soon",
  },
];
