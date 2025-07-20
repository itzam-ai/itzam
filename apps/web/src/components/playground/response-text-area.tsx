"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="relative h-full" ref={scrollAreaRef}>
      <ScrollArea className={cn("rounded-lg px-6 h-full", className)}>
        <div
          className="pr-6 pb-8 prose prose-sm dark:prose-invert prose-neutral max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2"
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
        <>
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 rounded-b-xl bg-gradient-to-t from-background to-transparent px-1 z-50" />

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="-top-7 absolute right-3.5"
              >
                <Maximize2 className="size-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-4xl">
              <DialogHeader>
                <DialogTitle>Response</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(80vh-4rem)]">
                <div className="p-0 pb-8 pr-4 prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-pre:my-2 prose-blockquote:my-2">
                  {markdownContent ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownContent}
                    </ReactMarkdown>
                  ) : (
                    children
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
