import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/decor-icon";
import { ArrowUpRightIcon } from "lucide-react";

type Channel = {
  src: string;
  name: string;
  description: string;
  comingSoon?: boolean;
};

const data: Channel[] = [
  {
    src: "/safari.png",
    name: "Web",
    description: "Add to any website in one line of code.",
  },
  {
    src: "/whatsapp.png",
    name: "WhatsApp",
    description: "Chat with customers directly inside WhatsApp.",
  },
  {
    src: "/instagram.png",
    name: "Instagram",
    description: "Auto-reply to Instagram DMs and comments.",
    comingSoon: true,
  },
  {
    src: "/messages.png",
    name: "Messages",
    description: "Bring your AI agent into iMessage conversations.",
    comingSoon: true,
  },
];

export function Channels({ waitlistEnabled = false }: { waitlistEnabled?: boolean }) {
  return (
    <div className="mb-12 lg:mb-24 mx-auto w-full max-w-5xl border-t">
      <div className="mx-auto max-w-3xl text-center my-6">
        <h2 className="text-balance font-medium text-2xl md:text-4xl lg:text-5xl">Channels</h2>
        <p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
          Deploy the same AI agent across every channel your customers already use.
        </p>
      </div>
      <div
        className={cn(
          "relative mx-auto grid gap-1 border-y lg:bg-secondary p-1 sm:grid-cols-2 lg:grid-cols-4 dark:bg-secondary/50",
        )}
      >
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        {data.map((item) => (
          <div
            className={cn(
              "group relative flex flex-col justify-between gap-3 rounded-md bg-background p-6 shadow-sm",
            )}
            key={item.name}
          >
            {item.comingSoon && (
              <Badge className="absolute top-2 right-2 rounded-md" variant="outline">
                Coming Soon
              </Badge>
            )}
            <Image
              alt={`${item.name} channel`}
              className="pointer-events-none size-8 shrink-0 select-none rounded-md object-contain"
              height={32}
              src={item.src}
              width={32}
            />
            <div className="space-y-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-muted-foreground text-xs md:text-sm">{item.description}</p>
            </div>
          </div>
        ))}
        {/* Links to /features/channels, which the proxy redirects home
         * while waitlisted. */}
        {!waitlistEnabled && (
          <div className="relative flex items-center justify-center p-1 sm:col-span-2 lg:col-span-4">
            <Button
              className="group text-xs"
              size="sm"
              variant="link"
              render={<Link href="/features/channels" />}
              nativeButton={false}
            >
              View all channels
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
