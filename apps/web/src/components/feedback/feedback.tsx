"use client";

import { Speech } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "../ui/morphing-popover";
import { FeedbackForm } from "./form";

const TRANSITION_POPOVER = {
  type: "spring" as const,
  bounce: 0.1,
  duration: 0.3,
};

export function Feedback() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed right-8 bottom-8 z-50">
      <MorphingPopover
        transition={TRANSITION_POPOVER}
        open={isOpen}
        onOpenChange={setIsOpen}
        className="relative flex flex-col items-end justify-end"
      >
        <MorphingPopoverTrigger
          className="border-border bg-background text-foreground hover:opacity-80 transition-opacity flex size-10 items-center justify-center rounded-full border shadow-md"
          style={{
            transformOrigin: "bottom right",
            originX: "right",
            originY: "bottom",
            scaleX: 1,
            scaleY: 1,
          }}
        >
          <span className="sr-only">Help</span>
          <motion.span
            animate={{
              opacity: isOpen ? 0 : 1,
            }}
            transition={{
              duration: 0,
              delay: isOpen ? 0 : TRANSITION_POPOVER.duration / 2,
            }}
          >
            <Speech className="text-foreground size-4" />
          </motion.span>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent
          className="border-border bg-popover fixed right-4 bottom-4 min-w-[320px] rounded-xl border p-0 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)]"
          style={{
            transformOrigin: "bottom right",
          }}
        >
          <FeedbackForm onClose={closeMenu} />
        </MorphingPopoverContent>
      </MorphingPopover>
    </div>
  );
}
