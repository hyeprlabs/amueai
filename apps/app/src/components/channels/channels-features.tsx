import { MessageCircleIcon } from "lucide-react";

import { EmbedGraphic } from "@/components/agent/embed-graphic";
import { ComingSoonGraphic } from "@/components/channels/coming-soon-graphic";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { WhatsAppGraphic } from "@/components/channels/whatsapp-graphic";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SectionHeading } from "@/components/marketing/page-hero";
import { FeatureGridCard } from "@/components/marketing/feature-grid-card";

/**
 * The illustrated channel grid: one agent, wired into every place a customer
 * already talks. Two columns from `sm`, four from `lg` — simpler than the
 * agent page's bento since every cell here carries equal weight.
 */
export function ChannelsFeatures() {
  return (
    <section className="mb-12 lg:mb-24">
      <SectionHeading
        description="Train it once. It answers everywhere your customers already are."
        title="One agent, every channel"
      />

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <FeatureGridCard
            description="Paste one script tag. The chat bubble is live on every page."
            title="Web"
          >
            <EmbedGraphic />
          </FeatureGridCard>

          <FeatureGridCard
            description="Answer order and support questions right inside WhatsApp."
            title="WhatsApp"
          >
            <WhatsAppGraphic />
          </FeatureGridCard>

          <FeatureGridCard description="Auto-reply to DMs and comments." title="Instagram">
            <ComingSoonGraphic icon={<InstagramIcon />} />
          </FeatureGridCard>

          <FeatureGridCard description="Bring your agent into iMessage." title="Messages">
            <ComingSoonGraphic icon={<MessageCircleIcon />} />
          </FeatureGridCard>
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
