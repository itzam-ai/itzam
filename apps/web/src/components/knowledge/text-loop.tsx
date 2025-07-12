"use client";
import {
  AnimatePresence,
  AnimatePresenceProps,
  motion,
  Transition,
  Variants,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

export type TextLoopProps = {
  value: string | null;
  className?: string;
  transition?: Transition;
  variants?: Variants;
  onValueChange?: (value: string) => void;
  mode?: AnimatePresenceProps["mode"];
};

export function TextLoop({
  value,
  className,
  transition = { duration: 0.3 },
  variants,
  onValueChange,
}: TextLoopProps) {
  const prevValueRef = useRef<string | null>(value);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (prevValueRef.current !== value && value) {
      if (!isFirstRenderRef.current) {
        onValueChange?.(value);
      }
      prevValueRef.current = value;
    }
    isFirstRenderRef.current = false;
  }, [value, onValueChange]);

  const motionVariants: Variants = {
    initial: { y: 15, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -15, opacity: 0 },
  };

  if (!value) return null;

  return (
    <div
      className={cn(
        "relative inline-block whitespace-nowrap overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={isFirstRenderRef.current ? false : "initial"}
          animate="animate"
          exit="exit"
          transition={transition}
          variants={variants || motionVariants}
          className="max-w-64 truncate"
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
