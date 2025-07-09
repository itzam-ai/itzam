"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "../ui/dialog";

export interface ImageAttachmentProps {
  mimeType: string;
  url: string;
}

export const ImageAttachment = ({ mimeType, url }: ImageAttachmentProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Image
        src={url}
        alt={mimeType}
        className="rounded-lg size-12 object-cover"
        width={240}
        height={240}
        onClick={() => setIsOpen(true)}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="min-w-[60vw] min-h-[60vh]">
          <div className="flex w-full h-full justify-center items-center p-4">
            <Image
              src={url}
              alt={mimeType}
              className="object-contain rounded-lg w-full h-full"
              width={1920}
              height={1080}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};