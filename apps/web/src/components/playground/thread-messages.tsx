"use client";

import { AnimatePresence, motion } from "framer-motion";
import ModelIcon from "public/models/svgs/model-icon";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-4 p-4 min-h-[400px] max-h-[600px]"
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              delay: index * 0.05,
            }}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1 }}
                className="flex-shrink-0 mt-1"
              >
                <ModelIcon
                  tag={message.model?.tag || currentModel?.tag || ""}
                  size="xs"
                />
              </motion.div>
            )}

            <motion.div
              layout
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <p
                className={cn(
                  "text-xs mt-1 opacity-60",
                  message.role === "user"
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                {message.timestamp.toLocaleTimeString()}
              </p>
            </motion.div>
          </motion.div>
        ))}

        {/* Streaming message */}
        {isLoading && streamingContent !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 mt-1">
              <ModelIcon tag={currentModel?.tag || ""} size="xs" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-muted">
              <p className="text-sm whitespace-pre-wrap break-words">
                {streamingContent || ""}
              </p>
              {!streamingContent && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex gap-1"
                >
                  <span className="w-2 h-2 bg-current rounded-full" />
                  <span className="w-2 h-2 bg-current rounded-full" />
                  <span className="w-2 h-2 bg-current rounded-full" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}