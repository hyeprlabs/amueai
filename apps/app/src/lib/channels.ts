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
