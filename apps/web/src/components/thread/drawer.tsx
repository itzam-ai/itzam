"use client";

import { RunWithModelAndResourcesAndAttachmentsAndThreads } from "@itzam/server/db/run/actions";
import { FileIcon, MessagesSquare } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { useEffect, useState } from "react";
import { getThreadRunsHistory } from "@itzam/server/db/thread/actions";
import Link from "next/link";
import Image from "next/image";

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
            <DrawerDescription>{run.thread?.lookupKey}</DrawerDescription>
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
                          <Link
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={attachment.url}
                            className="flex size-12 items-center justify-center rounded-lg border border-muted transition-all hover:border-muted-foreground/50"
                          >
                            {attachment.mimeType.startsWith("image/") ? (
                              <Image
                                src={attachment.url}
                                alt={attachment.mimeType}
                                width={1920}
                                height={1080}
                                className="size-12 rounded-lg object-cover"
                              />
                            ) : (
                              <FileIcon className="size-4" />
                            )}
                          </Link>
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
