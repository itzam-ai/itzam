"use client";

import { useState } from "react";

import { OlderChat } from "@itzam/server/db/chat/actions";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { CommandItem } from "~/components/ui/command";
import ModelIcon from "public/models/svgs/model-icon";
import { deleteChat, updateChatTitle } from "@itzam/server/db/chat/actions";
import { Button } from "~/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
export const ChatItem = ({
  chat,
  chatId,
}: {
  chat: OlderChat;
  chatId: string;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title || "Untitled");

  const handleDeleteChat = async (id: string) => {
    await deleteChat(id);
  };

  const handleUpdateChatTitle = async (id: string, title: string) => {
    await updateChatTitle(id, title);
  };

  return (
    <CommandItem
      key={chat.id}
      value={chat.id}
      keywords={[title, chat.lastModel?.name || ""]}
      className="cursor-pointer"
      onSelect={() => {
        if (chat.id !== chatId) {
          router.push(`/chat/${chat.id}`);
        }
      }}
    >
      <div className="flex justify-between w-full px-1">
        <div className="flex flex-col gap-2">
          <span className="font-medium flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditing(false);
                  handleUpdateChatTitle(chat.id, title);
                }}
                className="bg-transparent outline-none"
              />
            ) : (
              <span onClick={() => setIsEditing(true)}>{title}</span>
            )}
            {chat.id === chatId && (
              <div className="rounded-full bg-muted-foreground p-1" />
            )}
          </span>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <ModelIcon size="xs" tag={chat.lastModel?.tag ?? ""} />
            {chat.lastModel?.name}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Chat</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Are you sure you want to delete this chat and all its messages?
              </DialogDescription>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteChat(chat.id)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </CommandItem>
  );
};
