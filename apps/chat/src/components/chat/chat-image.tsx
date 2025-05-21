"use client";

import { Attachment } from "ai";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useState } from "react";

export const ChatImage = ({ attachment }: { attachment: Attachment }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Image
        src={attachment.url}
        alt={attachment.name ?? "Image"}
        className="rounded-2xl size-36 object-cover border-4 border-muted bg-muted cursor-pointer hover:opacity-80 transition-opacity"
        width={240}
        height={240}
        onClick={() => setIsOpen(true)}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{attachment.name ?? "Image"}</DialogTitle>
          </DialogHeader>
          <div className="flex w-full h-full justify-center items-center">
            <Image
              src={attachment.url}
              alt={attachment.name ?? "Image"}
              className="object-contain rounded-lg w-full h-full"
              width={240}
              height={240}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
