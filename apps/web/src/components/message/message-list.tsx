"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useKeyboardShortcut } from "~/lib/shortcut";
import { MessageItem } from "./message-item";
import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import ModelIcon from "public/models/svgs/model-icon";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: ModelWithCostAndProvider;
  isLoading?: boolean;
}

interface MessageListProps {
  messages: Message[];
  currentModel?: ModelWithCostAndProvider | null;
  isLoading?: boolean;
  streamingContent?: string;
  showTimestamps?: boolean;
  enableAnimations?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  currentModel,
  isLoading,
  streamingContent,
  showTimestamps = false,
  enableAnimations = true,
  className = "",
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Check if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;

    setIsAutoScrollEnabled(isAtBottom);
    setShowJumpToBottom(!isAtBottom && (isLoading || messages.length > 0));
  }, [isLoading, messages.length]);

  // Auto-scroll to bottom when new content arrives (if enabled)
  useEffect(() => {
    if (scrollRef.current && isAutoScrollEnabled) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, streamingContent, isAutoScrollEnabled]);

  // Jump to bottom function
  const jumpToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
        setIsAutoScrollEnabled(true);
        setShowJumpToBottom(false);
      }
    }
  }, []);

  // Keyboard shortcut for jump to bottom
  useKeyboardShortcut("b", false, false, false, () => {
    if (showJumpToBottom) {
      jumpToBottom();
    }
  });

  const renderMessage = (message: Message) => (
    <MessageItem
      role={message.role}
      content={message.content}
      timestamp={message.timestamp}
      model={message.model}
      showTimestamp={showTimestamps}
    />
  );

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      <ScrollArea className="flex-1" ref={scrollRef} onScrollCapture={handleScroll}>
        <div className="flex flex-col gap-6 p-6 pb-4">
          {enableAnimations ? (
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={message.role === "user" ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: message.role === "user" ? 0 : 0.2,
                    ease: "easeOut",
                  }}
                  className="flex flex-col gap-3"
                >
                  {renderMessage(message)}
                </motion.div>
              ))}

              {/* Streaming message */}
              {isLoading && streamingContent !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex justify-start">
                    <div className="flex flex-col gap-2 items-start max-w-[80%] py-2">
                      <p className="text-sm">
                        {streamingContent || (
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="inline-flex gap-1"
                          >
                            <span className="w-2 h-2 bg-current rounded-full" />
                            <span className="w-2 h-2 bg-current rounded-full" />
                            <span className="w-2 h-2 bg-current rounded-full" />
                          </motion.span>
                        )}
                      </p>
                      <div className="flex gap-1.5 items-center">
                        <ModelIcon tag={currentModel?.tag || ""} size="us" />
                        <p className="text-xs text-muted-foreground">
                          {currentModel?.name || "AI"}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-3">
                  {renderMessage(message)}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Jump to bottom button */}
      <AnimatePresence>
        {showJumpToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 right-6"
          >
            <Button
              onClick={jumpToBottom}
              size="sm"
              variant="secondary"
              className="gap-2 shadow-lg"
            >
              <ArrowDown className="h-4 w-4" />
              Jump to bottom
              <span
                style={{
                  fontSize: "10px",
                }}
                className="text-muted font-mono bg-muted rounded-sm px-1 border border-border/20 dark:text-foreground"
              >
                B
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}