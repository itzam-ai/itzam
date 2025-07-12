"use client";

import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export type ScrollButtonProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
  threshold?: number;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function ScrollButton({
  containerRef,
  className,
  threshold = 200,
  variant = "outline",
  size = "sm",
  ...props
}: ScrollButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        setIsVisible(scrollTop + clientHeight < scrollHeight - threshold);
      }
    };

    const container = containerRef.current;

    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [containerRef, threshold]);

  const handleScroll = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "rounded-3xl transition-all duration-150 ease-out",
        isVisible
          ? "translate-y-0 scale-100 opacity-100 dark:bg-muted bg-background text-primary"
          : "pointer-events-none translate-y-4 scale-95 opacity-0",
        className,
      )}
      onClick={handleScroll}
      {...props}
    >
      Scroll to bottom
      <ChevronDown className="size-3" />
    </Button>
  );
}

export { ScrollButton };
