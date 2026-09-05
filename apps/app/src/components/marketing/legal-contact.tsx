import { cn } from "@/lib/utils";
import { XIcon } from "@/components/icons/x-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecorIcon } from "@/components/decor-icon";
import { Mail, Users } from "lucide-react";

const APP_EMAIL = "amueai@hyeprlabs.com";
const X_HANDLE = "@hyeprlabs";
const X_URL = `https://x.com/${X_HANDLE.slice(1)}`;
const DISCORD_URL = "https://discord.gg/TODO";

const data = [
  {
    title: "Email Us",
    description: "We respond to all emails within 24 hours.",
    icon: <Mail />,
    href: `mailto:${APP_EMAIL}`,
    label: APP_EMAIL,
  },
  {
    title: "Send Us DM",
    description: "Send us a direct message on X for quick answers.",
    icon: <XIcon />,
    href: X_URL,
    label: X_HANDLE,
  },
  {
    title: "Join the Community",
    description: "Join our community to connect with other users.",
    icon: <Users />,
    href: DISCORD_URL,
    label: "Join Discord",
    comingSoon: true,
  },
];

export function LegalContact() {
  return (
    <div className="mx-auto max-w-4xl mb-12 lg:mb-24 border-t">
      <div className="flex max-w-md flex-col justify-center gap-2 p-4 lg:pb-12">
        <h2 className="font-bold text-2xl md:text-3xl">Contact Us</h2>
        <p className="text-base text-muted-foreground">
          We’re here to help and answer any question you might have. We look forward to hearing
          from you.
        </p>
      </div>
      <div className="relative grid gap-2 bg-muted p-2 md:grid-cols-3 dark:bg-muted/50 border-y">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        {data.map((item) => (
          <div
            className="relative flex flex-col gap-3 rounded-lg bg-background px-6 py-6 shadow-xs"
            key={item.title}
          >
            {item.comingSoon && (
              <Badge className="absolute top-2 right-2 rounded-md" variant="outline">
                Coming Soon
              </Badge>
            )}
            <div
              className={cn(
                "flex items-center gap-x-2",
                "[&_svg]:size-4 [&_svg]:text-muted-foreground",
              )}
            >
              {item.icon}
              <h3 className="text-sm">{item.title}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{item.description}</p>
            <div className="mt-1 flex items-center gap-x-2">
              <Button variant="link" render={<a href={item.href} />} nativeButton={false}>
                {item.label}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
