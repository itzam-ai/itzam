"use client";
import {
  AnimatePresence,
  AnimatePresenceProps,
  motion,
  Transition,
  Variants,
} from "framer-motion";
import { Children, useEffect, useState } from "react";
import { cn } from "~/lib/utils";

export type TextLoopProps = {
  children: React.ReactNode[];
  className?: string;
  interval?: number;
  transition?: Transition;
  variants?: Variants;
  onIndexChange?: (index: number) => void;
  trigger?: boolean;
  mode?: AnimatePresenceProps["mode"];
};

export function TextLoop({
  children,
  className,
  interval = 2,
  transition = { duration: 0.3 },
  variants,
  onIndexChange,
  trigger = true,
  mode = "popLayout",
}: TextLoopProps) {
  const items = Children.toArray(children);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!trigger) {
      // When trigger is false, show the last valid item
      const lastIndex = items.length - 1;
      if (lastIndex > currentIndex) {
        setCurrentIndex(lastIndex);
      }
      return;
    }

    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, trigger, currentIndex]);

  const motionVariants: Variants = {
    initial: { y: 15, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -15, opacity: 0 },
  };

  if (!items.length) return null;

  return (
    <div
      className={cn(
        "relative inline-block whitespace-nowrap overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode={mode} initial={false}>
        <motion.div
          key={currentIndex}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
          variants={variants || motionVariants}
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
