"use client";

import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { useKeyboardShortcut } from "~/lib/shortcut";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: ModelWithCostAndProvider;
  isLoading?: boolean;
}

interface ThreadMessagesProps {
  messages: Message[];
  currentModel: ModelWithCostAndProvider | null;
  isLoading?: boolean;
  streamingContent?: string;
}

export function ThreadMessages({
  messages,
  currentModel,
  isLoading,
  streamingContent,
}: ThreadMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Check if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;

    setIsAutoScrollEnabled(isAtBottom);
    setShowJumpToBottom(!isAtBottom && (isLoading || messages.length > 0));
  }, [isLoading, messages.length]);

  // Auto-scroll to bottom when new content arrives (if enabled)
  useEffect(() => {
    if (scrollRef.current && isAutoScrollEnabled) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isAutoScrollEnabled]);

  // Jump to bottom function
  const jumpToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsAutoScrollEnabled(true);
      setShowJumpToBottom(false);
    }
  }, []);

  // Keyboard shortcut for jump to bottom
  useKeyboardShortcut("b", false, false, false, jumpToBottom);

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-col gap-6 p-6 max-h-[calc(100vh-20rem)] overflow-y-scroll hide-scrollbar pb-4"
      >
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
              {message.role === "user" ? (
                /* User message - right aligned */
                <div className="flex justify-end gap-1">
                  <div className="flex flex-col gap-2 items-end max-w-[80%]">
                    <div className="bg-muted text-foreground rounded-full px-4 py-2">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Assistant message - left aligned */
                <div className="flex justify-start">
                  <div className="flex flex-col gap-2 items-start max-w-[80%] py-2">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex gap-1.5 items-center">
                      <ModelIcon
                        tag={message.model?.tag || currentModel?.tag || ""}
                        size="us"
                      />
                      <p className="text-xs text-muted-foreground">
                        {message.model?.name || currentModel?.name || "AI"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
      </div>

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
