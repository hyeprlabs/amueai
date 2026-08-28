import Image from "next/image";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SectionHeading } from "@/components/marketing/page-hero";

type Channel = {
  src: string;
  title: string;
  description: string;
  comingSoon?: boolean;
};

const channels: Channel[] = [
  {
    src: "/safari.png",
    title: "Web",
    description: "Paste one script tag. The chat bubble is live on every page.",
  },
  {
    src: "/whatsapp.png",
    title: "WhatsApp",
    description: "Answer order and support questions right inside WhatsApp.",
  },
  {
    src: "/instagram.png",
    title: "Instagram",
    description: "Auto-reply to DMs and comments.",
    comingSoon: true,
  },
  {
    src: "/messages.png",
    title: "Messages",
    description: "Bring your agent into iMessage.",
    comingSoon: true,
  },
];

export function ChannelsFeatures() {
  return (
    <section className="mb-12 lg:mb-24">
      <SectionHeading
        description="Train it once. It answers everywhere your customers already are."
        title="One agent, every channel"
      />

      <div className="relative bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.04),transparent)] dark:bg-[radial-gradient(35%_80%_at_25%_0%,--theme(--color-foreground/.08),transparent)]">
        <FullWidthDivider className="-top-px" />
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel) => (
            <div
              className={cn(
                "group relative flex flex-col justify-between gap-3 rounded-md bg-background p-6 shadow-sm",
              )}
              key={channel.title}
            >
              {channel.comingSoon && (
                <Badge className="absolute top-2 right-2 rounded-md" variant="outline">
                  Coming Soon
                </Badge>
              )}
              <Image
                alt={`${channel.title} channel`}
                className="pointer-events-none size-8 shrink-0 select-none rounded-md object-contain"
                height={32}
                src={channel.src}
                width={32}
              />
              <div className="space-y-1">
                <h3 className="font-semibold">{channel.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm">{channel.description}</p>
              </div>
            </div>
          ))}
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
