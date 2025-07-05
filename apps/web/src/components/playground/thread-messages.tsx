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
      className="flex flex-col gap-6 p-6 max-h-[calc(100vh-20rem)] overflow-y-scroll hide-scrollbar pb-4"
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
            className="flex flex-col gap-3"
          >
            {message.role === "user" ? (
              /* User message - right aligned */
              <div className="flex justify-end gap-1">
                <motion.div
                  layout
                  className="flex flex-col gap-2 items-end max-w-[80%]"
                >
                  <div className="bg-muted text-foreground rounded-full px-4 py-2">
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </motion.div>
              </div>
            ) : (
              /* Assistant message - left aligned */
              <div className="flex justify-start">
                <motion.div
                  layout
                  className="flex flex-col gap-2 items-start max-w-[80%] py-2"
                >
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
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Streaming message */}
        {isLoading && streamingContent !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
  );
}