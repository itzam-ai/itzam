"use client";

import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface ModeToggleProps {
  mode: "single" | "thread";
  onModeChange: (mode: "single" | "thread") => void;
  className?: string;
}

export function ModeToggle({ mode, onModeChange, className }: ModeToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-lg bg-muted/30",
        className
      )}
    >
      <Button
        size="sm"
        variant={mode === "single" ? "secondary" : "ghost"}
        onClick={() => onModeChange("single")}
        className="relative"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Single</span>
      </Button>

      <Button
        size="sm"
        variant={mode === "thread" ? "secondary" : "ghost"}
        onClick={() => onModeChange("thread")}
        className="relative"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>Thread</span>
      </Button>
    </div>
  );
}
