"use client";

import { createChat, OlderChat } from "@itzam/server/db/chat/actions";
import { useAtom } from "jotai";
import {
  BarChart2,
  Bot,
  CircleUser,
  Command,
  History,
  LogOut,
  Moon,
  SquarePen,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "~/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { statsForNerdsAtom } from "~/lib/atoms";
import { useKeyboardShortcut } from "~/lib/shortcut";
import { ChatItem } from "./chat/chat-item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Kbd } from "./ui/kbd";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { createClient } from "supabase/utils/client";
import { useRouter } from "next/navigation";

export function UserMenu({
  olderChats,
  chatId,
  hasActiveSubscription,
}: {
  olderChats: OlderChat[];
  chatId: string;
  hasActiveSubscription: boolean;
}) {
  const supabase = createClient();
  const { user } = useCurrentUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, setStatsForNerds] = useAtom(statsForNerdsAtom);
  const [openKeyboardShortcuts, setOpenKeyboardShortcuts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      await createChat();
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // CMD + Shift + H -> open chat history
  useKeyboardShortcut("h", true, () => {
    setOpen(true);
  });

  // CMD + Shift + N -> create new chat
  useKeyboardShortcut("c", true, () => {
    handleNewChat();
  });

  // CMD + Shift + D -> open model selector
  useKeyboardShortcut("d", true, () => {
    setStatsForNerds((prev) => !prev);
  });

  // CMD + Shift + T -> toggle theme
  useKeyboardShortcut("t", true, () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  });

  return (
    <div className="flex items-center gap-4">
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search older chats..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {olderChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} chatId={chatId} />
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(true);
              }}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <History className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">History</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              disabled={isLoading}
              className="cursor-pointer mr-1"
            >
              <SquarePen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New chat</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center cursor-pointer outline-none border-none focus:outline-none focus:ring-0">
          {user?.user_metadata.avatar_url ? (
            <div className="size-8 flex items-center justify-center rounded-lg hover:bg-accent duration-200 transition-all">
              <Image
                src={user?.user_metadata.avatar_url ?? ""}
                alt="User"
                width={32}
                height={32}
                className="rounded-full size-6"
              />
            </div>
          ) : (
            <div className="size-8 flex items-center justify-center rounded-lg hover:bg-accent duration-200 transition-all">
              <CircleUser className="size-4" />
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" sideOffset={12}>
          <DropdownMenuLabel>
            <div className="flex items-center gap-3 pr-6">
              {user?.user_metadata.avatar_url ? (
                <Image
                  src={user?.user_metadata.avatar_url ?? ""}
                  alt="User"
                  width={32}
                  height={32}
                  className="rounded-full size-8"
                />
              ) : (
                <CircleUser className="size-6" />
              )}
              <div className="flex flex-col">
                <p className="text-sm font-medium">
                  {user?.user_metadata.name}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link
            href={`https://itz.am/dashboard${hasActiveSubscription ? "" : "/settings"}`}
            target="_blank"
          >
            <DropdownMenuItem>
              <div className="size-4 flex items-center justify-center">
                <Image src="/logo.svg" alt="Dashboard" width={12} height={12} />
              </div>
              {hasActiveSubscription ? "Dashboard" : "Subscribe"}
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            onClick={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
            }}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            Toggle Theme
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setStatsForNerds((prev) => !prev);
            }}
          >
            <BarChart2 className="size-4" />
            Show stats for nerds
          </DropdownMenuItem>
          <Dialog
            open={openKeyboardShortcuts}
            onOpenChange={setOpenKeyboardShortcuts}
          >
            <DialogTrigger asChild>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setOpenKeyboardShortcuts(true);
                }}
              >
                <Command className="size-4" />
                Keyboard shortcuts
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="w-fit">
              <DialogHeader>
                <DialogTitle>Keyboard shortcuts</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-y-6 mt-2 min-w-[300px]">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <History className="size-4 text-muted-foreground" />
                    Open chat history
                  </p>
                  <p className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>H</Kbd>
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <SquarePen className="size-4 text-muted-foreground" />
                    Create new chat
                  </p>
                  <p className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>N</Kbd>
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Bot className="size-4 text-muted-foreground" />
                    Open model selector
                  </p>
                  <p className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>M</Kbd>
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <BarChart2 className="size-4 text-muted-foreground" />
                    Show stats for nerds
                  </p>
                  <p className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>D</Kbd>
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {resolvedTheme === "dark" ? (
                      <Sun className="size-4 text-muted-foreground" />
                    ) : (
                      <Moon className="size-4 text-muted-foreground" />
                    )}
                    Toggle theme
                  </p>
                  <p className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>T</Kbd>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuItem
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/");
            }}
          >
            <LogOut className="size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
