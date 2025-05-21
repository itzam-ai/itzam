"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

interface ResponseTextAreaProps {
  className?: string;
  height?: string;
  children: React.ReactNode;
}

export function ResponseTextArea({
  className,
  children,
}: ResponseTextAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const markdownContent = typeof children === "string" ? children : "";

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewportElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement;
      if (viewportElement) {
        viewportElement.scrollTo({
          top: viewportElement.scrollHeight,
          behavior: "auto",
        });
      }
    }
  };

  const checkOverflow = () => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHasOverflow(contentHeight > 360);
    }
  };

  useEffect(() => {
    // Auto-scroll to the bottom when content changes
    scrollToBottom();
    checkOverflow();

    // Check overflow when content changes
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div className="relative" ref={scrollAreaRef}>
      <ScrollArea className={cn("rounded-lg px-6", className)}>
        <div
          className="pr-6 pb-8 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2"
          ref={contentRef}
        >
          {markdownContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownContent}
            </ReactMarkdown>
          ) : (
            children
          )}
        </div>
      </ScrollArea>

      {hasOverflow && (
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-64 bg-gradient-to-t from-background to-transparent px-1 blur-xl" />
      )}
    </div>
  );
}
