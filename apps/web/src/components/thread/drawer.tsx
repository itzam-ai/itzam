"use client";

import { RunWithModelAndResourcesAndAttachmentsAndThreads } from "@itzam/server/db/run/actions";
import { getThreadRunsHistory } from "@itzam/server/db/thread/actions";
import { FileIcon, MessagesSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

export function ThreadDrawer({
  run,
}: {
  run: RunWithModelAndResourcesAndAttachmentsAndThreads;
}) {
  const [runs, setRuns] = useState<
    RunWithModelAndResourcesAndAttachmentsAndThreads[]
  >([]);

  useEffect(() => {
    const fetchRuns = async () => {
      const runs = await getThreadRunsHistory(run.thread?.id ?? "");
      setRuns(runs as RunWithModelAndResourcesAndAttachmentsAndThreads[]);
    };
    fetchRuns();
  }, [run.thread?.id]);

  return (
    <Drawer direction="right" shouldScaleBackground>
      <DrawerTrigger>
        <div className="text-sm flex gap-2 items-center hover:opacity-70 transition-opacity cursor-pointer">
          <MessagesSquare className="size-3.5 text-muted-foreground" />
          {run.thread?.name}
        </div>
      </DrawerTrigger>
      <DrawerContent className="w-[500px]">
        <div className="p-6">
          <DrawerHeader>
            <DrawerTitle className="text-base">{run.thread?.name}</DrawerTitle>
            <DrawerDescription>
              {run.thread?.lookupKeys?.map((key) => key.lookupKey).join(", ")}
            </DrawerDescription>{" "}
          </DrawerHeader>
          <div className="flex flex-col gap-4 mt-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
            {runs.map((run) => (
              <div key={run.id} className="flex flex-col gap-3">
                {/* User message (input) - right aligned */}
                <div className="flex justify-end gap-1">
                  <div className="flex flex-col gap-1.5 items-end max-w-[80%]">
                    {run.attachments && run.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {run.attachments.map((attachment) => (
                          <div
                            key={attachment.url}
                            className="flex size-12 items-center justify-center rounded-lg border cursor-pointer border-muted transition-all hover:border-muted-foreground/50 hover:opacity-80"
                          >
                            {attachment.mimeType.startsWith("image/") ? (
                              <ImageAttachment
                                mimeType={attachment.mimeType}
                                url={attachment.url}
                              />
                            ) : (
                              <Link
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={attachment.url}
                              >
                                <FileIcon className="size-4" />
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-primary text-primary-foreground rounded-2xl px-3 py-2 rounded-br-none">
                      <p className="text-sm">{run.input}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {run.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Assistant message (output) - left aligned */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-3 py-2 max-w-[80%] rounded-bl-none">
                    <p className="text-sm">{run.output}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export const ImageAttachment = ({
  mimeType,
  url,
}: {
  mimeType: string;
  url: string;
}) => {
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
