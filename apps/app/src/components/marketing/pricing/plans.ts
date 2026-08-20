/**
 * Plan catalogue shared by the pricing UI and the `Offer` structured data on
 * the pricing page, so what customers read and what crawlers index cannot drift.
 */
export type Plan = {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly: number; // yearly per month
  };
  features: string[];
  btn: {
    text: string;
    href: string;
  };
};

export const plans: Plan[] = [
  {
    name: "Basic",
    info: "For most individuals",
    price: {
      monthly: 7,
      yearly: 6,
    },
    features: [
      "Up to 3 Blog posts",
      "Up to 3 Transcriptions",
      "Up to 3 Posts stored",
      "Markdown support",
      "Community support",
      "AI powered suggestions",
    ],
    btn: {
      text: "Start Your Free Trial",
      href: "#",
    },
  },
  {
    name: "Pro",
    info: "For small businesses",
    price: {
      monthly: 17,
      yearly: 14,
    },
    features: [
      "Up to 500 Blog Posts",
      "Up to 500 Transcriptions",
      "Up to 500 Posts stored",
      "Unlimited Markdown support",
      "SEO optimization tools",
      "Priority support",
      "AI powered suggestions",
    ],
    btn: {
      text: "Get started",
      href: "#",
    },
  },
  {
    name: "Business",
    info: "For large organizations",
    price: {
      monthly: 49,
      yearly: 40,
    },
    features: [
      "Unlimited Blog Posts",
      "Unlimited Transcriptions",
      "Unlimited Posts stored",
      "Unlimited Markdown support",
      "SEO optimization tools",
      "Priority support",
      "AI powered suggestions",
    ],
    btn: {
      text: "Contact team",
      href: "#",
    },
  },
];
