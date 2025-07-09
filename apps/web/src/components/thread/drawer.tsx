"use client";

import { RunWithResourcesAndAttachments } from "@itzam/server/db/run/actions";
import { getThreadRunsHistory } from "@itzam/server/db/thread/actions";
import { MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { MessageItem } from "../message/message-item";

export function ThreadDrawer({
  thread,
}: {
  thread: {
    id: string;
    name: string;
    lookupKeys: {
      lookupKey: string;
    }[];
  };
}) {
  const [runs, setRuns] = useState<RunWithResourcesAndAttachments[]>([]);

  useEffect(() => {
    const fetchRuns = async () => {
      const runs = await getThreadRunsHistory(thread.id);
      setRuns(runs as RunWithResourcesAndAttachments[]);
    };
    fetchRuns();
  }, [thread.id]);

  return (
    <Drawer direction="right" shouldScaleBackground>
      <DrawerTrigger>
        <div className="text-sm flex gap-2 items-center hover:opacity-70 transition-opacity cursor-pointer">
          <MessagesSquare className="size-3.5 text-muted-foreground" />
          {thread.name}
        </div>
      </DrawerTrigger>
      <DrawerContent className="w-[600px]">
        <div className="p-6">
          <DrawerHeader>
            <DrawerTitle className="text-base">{thread.name}</DrawerTitle>
            <DrawerDescription>
              {thread.lookupKeys?.map((key) => key.lookupKey).join(", ")}
            </DrawerDescription>{" "}
          </DrawerHeader>
          <div className="flex flex-col gap-6 mt-4 max-h-[calc(100vh-6rem)] overflow-y-scroll hide-scrollbar pb-4">
            {runs.map((run) => (
              <div key={run.id} className="flex flex-col gap-3">
                {/* User message */}
                <MessageItem
                  role="user"
                  content={run.input}
                  timestamp={run.createdAt}
                  attachments={run.attachments}
                  showTimestamp={true}
                />

                {/* Assistant message */}
                <MessageItem
                  role="assistant"
                  content={run.output || ""}
                  model={run.model}
                />
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
