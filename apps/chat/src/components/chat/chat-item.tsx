"use client";

import { useState } from "react";

import {
  deleteChat,
  OlderChat,
  updateChatTitle,
} from "@itzam/server/db/chat/actions";
import { formatDistanceToNow } from "date-fns";
import { Check, Loader2, Pencil, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import ModelIcon from "public/models/svgs/model-icon";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CommandItem } from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
export const ChatItem = ({
  chat,
  chatId,
}: {
  chat: OlderChat;
  chatId: string;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title || "Untitled");

  const handleDeleteChat = async (id: string) => {
    setIsDeleting(true);
    await deleteChat(id);
    setIsDeleting(false);
  };

  const handleUpdateChatTitle = async (id: string, title: string) => {
    await updateChatTitle(id, title);
    setIsEditing(false);
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
      <div className="flex justify-between w-full px-1.5">
        <div className="flex flex-col gap-2">
          <span className="font-medium flex items-center gap-2">
            {isEditing ? (
              <input
                type="text"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent outline-none"
              />
            ) : (
              <span onClick={() => setIsEditing(true)}>{title}</span>
            )}
            {chat.id === chatId && (
              <Badge variant="outline" size="sm">
                Current
              </Badge>
            )}
          </span>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <ModelIcon size="xs" tag={chat.lastModel?.tag ?? ""} />
            {chat.lastModel?.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
          </span>
          <div className="flex items-center z-[100]">
            <Button
              variant="link"
              size="us"
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  setIsEditing(false);
                  handleUpdateChatTitle(chat.id, title);
                } else {
                  setIsEditing(true);
                }
              }}
              disabled={isDeleting}
            >
              {isEditing ? (
                <Check className="size-3" />
              ) : (
                <Pencil className="size-3" />
              )}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  size="us"
                  disabled={isDeleting}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash className="size-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete Chat</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  Are you sure you want to delete this chat and all its
                  messages?
                </DialogDescription>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </CommandItem>
  );
};
