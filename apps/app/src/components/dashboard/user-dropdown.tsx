"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { GlobeIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserDropdown() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.fullName || user?.username || "Account";
  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter((initial): initial is string => Boolean(initial))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";
  const email = user?.primaryEmailAddress?.emailAddress || "No email address";

  if (!isLoaded) {
    return <Skeleton aria-label="Loading account" className="size-8 rounded-full" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Open account menu">
        <Avatar aria-label="Open account menu">
          <AvatarImage alt={displayName} src={user?.imageUrl} />
          <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 p-2">
            <Avatar className="size-8 shrink-0">
              <AvatarImage alt={displayName} src={user?.imageUrl} />
              <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col justify-center self-center leading-tight">
              <span className="truncate font-medium text-foreground text-sm">{displayName}</span>
              <span className="mt-1 truncate font-normal text-muted-foreground text-xs">
                {email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/profile" />}>
            <UserIcon className="opacity-60" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <SettingsIcon className="opacity-60" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/" />}>
          <GlobeIcon className="opacity-60" />
          <span>Homepage</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          variant="destructive"
        >
          <LogOutIcon className="opacity-60" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
