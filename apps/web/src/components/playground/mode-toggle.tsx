"use client";

import { motion } from "framer-motion";
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
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted/30", className)}>
      <Button
        size="sm"
        variant={mode === "single" ? "secondary" : "ghost"}
        onClick={() => onModeChange("single")}
        className="relative"
      >
        <motion.div
          animate={{
            scale: mode === "single" ? 1 : 0.9,
            opacity: mode === "single" ? 1 : 0.6,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <MessageSquare className="h-4 w-4" />
        </motion.div>
        <span className="ml-2">Single</span>
        {mode === "single" && (
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-0 bg-primary/10 rounded-md -z-10"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
      </Button>

      <Button
        size="sm"
        variant={mode === "thread" ? "secondary" : "ghost"}
        onClick={() => onModeChange("thread")}
        className="relative"
      >
        <motion.div
          animate={{
            scale: mode === "thread" ? 1 : 0.9,
            opacity: mode === "thread" ? 1 : 0.6,
            rotate: mode === "thread" ? 0 : -5,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </motion.div>
        <span className="ml-2">Thread</span>
        {mode === "thread" && (
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-0 bg-primary/10 rounded-md -z-10"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
        )}
      </Button>
    </div>
  );
}