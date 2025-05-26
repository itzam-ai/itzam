"use client";

import {
  ChevronRight,
  CircleUser,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

import { createClient } from "@itzam/supabase/client";
import { redirect } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function NavUser({
  name,
  avatar,
  email,
}: {
  name: string;
  avatar: string | undefined | null;
  email: string | undefined | null;
}) {
  const { setTheme, resolvedTheme } = useTheme();

  const supabase = createClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer outline-none border-none focus:outline-none focus:ring-0 hover:opacity-80 transition-opacity duration-200 p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {avatar ? (
            <Image
              src={avatar}
              alt="User"
              width={32}
              height={32}
              className="rounded-full size-5"
            />
          ) : (
            <CircleUser className="size-4" />
          )}
          <p className="text-sm font-medium">{name}</p>
        </div>
        <ChevronRight className="size-3 mr-0.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-64"
        side="right"
        align="end"
        sideOffset={6}
      >
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 pr-6">
            {avatar && (
              <Image
                src={avatar ?? ""}
                alt="User"
                width={32}
                height={32}
                className="rounded-full size-8"
              />
            )}
            <div className="flex flex-col">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-60 font-normal">
                {email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={async () => {
            redirect("/dashboard/settings");
          }}
        >
          <Settings className="size-3" strokeWidth={2.5} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
          }}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-3" strokeWidth={2.5} />
          ) : (
            <Moon className="size-3" strokeWidth={2.5} />
          )}
          Toggle Theme
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={async () => {
            await supabase.auth.signOut();
            redirect("/");
          }}
        >
          <LogOut className="size-3" strokeWidth={2.5} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
