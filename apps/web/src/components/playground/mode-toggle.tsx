"use client";

import { MessageSquare, MessagesSquareIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

interface ModeToggleProps {
  mode: "single" | "thread";
  onModeChange: (mode: "single" | "thread") => void;
  className?: string;
}

export function ModeToggle({ mode, onModeChange, className }: ModeToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as "single" | "thread")}
      className={cn("", className)}
    >
      <TabsList className="h-9 p-1">
        <TabsTrigger
          value="single"
          className="gap-1 data-[state=active]:bg-background"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Single</span>
        </TabsTrigger>
        <TabsTrigger
          value="thread"
          className="gap-1 data-[state=active]:bg-background"
        >
          <MessagesSquareIcon className="h-4 w-4" />
          <span>Thread</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
