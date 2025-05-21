"use client";

import NumberFlow from "@number-flow/react";
import { Message as AiMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { useAtom } from "jotai";
import { Check, Coins, Copy, DollarSign, Info, RefreshCcw } from "lucide-react";
import Image from "next/image";
import ModelIcon from "public/models/svgs/model-icon";
import { useState } from "react";
import { statsForNerdsAtom } from "~/lib/atoms";
import { cn } from "~/lib/utils";
import { ChatImage } from "./chat-image";
import { Kbd } from "../ui/kbd";
import { Markdown } from "../ui/markdown";
import {
  Reasoning,
  ReasoningContent,
  ReasoningResponse,
  ReasoningTrigger,
} from "../ui/reasoning";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
interface ExtendedMessage extends AiMessage {
  modelTag?: string;
  modelName?: string;
  tokensUsed?: number;
  tokensWithContext?: number;
  cost?: string;
}

export const Message = ({
  message,
  isLast,
  reload,
  status,
}: {
  message: ExtendedMessage;
  isLast: boolean;
  reload: () => void;
  status: "error" | "submitted" | "streaming" | "ready";
}) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const [copied, setCopied] = useState(false);
  const [statsForNerds] = useAtom(statsForNerdsAtom);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-2 w-full group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="flex gap-2 items-end flex-wrap justify-end w-[30rem]">
          {message.experimental_attachments &&
            message.experimental_attachments
              ?.filter((attachment) =>
                attachment.contentType?.startsWith("image/")
              )
              .map((attachment, index) => (
                <ChatImage
                  key={`${message.id}-${index}`}
                  attachment={attachment}
                />
              ))}
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 py-3 rounded-2xl",
            isUser ? "bg-muted rounded-full px-4 " : ""
          )}
        >
          {message.parts?.map((part, index) => {
            // text parts:
            if (part.type === "text") {
              return (
                <Markdown
                  className="prose dark:prose-invert max-w-none text-primary prose-hr:my-4"
                  key={index}
                >
                  {part.text}
                </Markdown>
              );
            }

            if (part.type === "reasoning") {
              const reasoning = part.details.find(
                (detail) => detail.type === "text"
              );

              return (
                <Reasoning key={index}>
                  <ReasoningTrigger className="text-sm flex items-center gap-2 hover:opacity-70 transition-opacity">
                    Reasoning
                  </ReasoningTrigger>
                  <ReasoningContent className="ml-2 mt-2 border-l-2 border-l-neutral-200 px-4 dark:border-l-neutral-700">
                    <ReasoningResponse text={reasoning?.text ?? ""} />
                  </ReasoningContent>
                </Reasoning>
              );
            }

            if (part.type === "file" && part.mimeType.startsWith("image/")) {
              return (
                <Image
                  key={index}
                  src={`data:${part.mimeType};base64,${part.data}`}
                  className="rounded-md max-w-[240px] h-auto w-full"
                  alt="Image"
                  width={240}
                  height={240}
                />
              );
            }

            // source parts:
            if (part.type === "source") {
              return (
                <div key={`source-${part.source.id}`}>
                  <a
                    href={part.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {part.source.title ?? new URL(part.source.url).hostname}
                  </a>
                </div>
              );
            }
          })}
        </div>

        <div className={cn("flex")}>
          {isAssistant && (status === "ready" || !isLast) && (
            <>
              {message.modelTag && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 mr-4"
                >
                  <ModelIcon tag={message.modelTag} size="xs" />
                  <span className="text-sm whitespace-nowrap flex items-center gap-2">
                    {message.modelName}
                    <AnimatePresence>
                      {statsForNerds && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            width: 0,
                            transition: {
                              duration: 0.3,
                              opacity: { delay: 0.3 },
                            },
                          }}
                          animate={{
                            opacity: 1,
                            width: "auto",
                            transition: {
                              duration: 0.3,
                              opacity: { delay: 0.3 },
                            },
                          }}
                          exit={{
                            opacity: 0,
                            width: 0,
                            transition: {
                              duration: 0.3,
                              width: { delay: 0.3 },
                            },
                          }}
                          className="text-foreground/70"
                        >
                          <Kbd>{message.modelTag}</Kbd>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </span>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 }}
                className="flex items-center gap-4"
              >
                {isLast && (
                  <button onClick={() => reload()}>
                    <RefreshCcw className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                )}
                <button onClick={handleCopy} disabled={copied}>
                  {copied ? (
                    <Check className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Copy className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </motion.div>
            </>
          )}
        </div>

        <AnimatePresence>
          {statsForNerds && (
            <motion.div
              initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
              exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex flex-col gap-2",
                isUser ? "items-end" : "items-start"
              )}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <Coins className="size-3 inline-block" />
                {isAssistant ? (
                  <NumberFlow
                    value={Number(message.tokensUsed ?? 0)}
                    suffix=" tokens"
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <NumberFlow value={Number(message.tokensUsed ?? 0)} />
                    <span className="text-muted-foreground">
                      (
                      <NumberFlow
                        value={Number(message.tokensWithContext ?? 0)}
                      />{" "}
                      with context
                    </span>
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <Info className="size-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          className="max-w-[300px]"
                          side="bottom"
                          sideOffset={12}
                        >
                          <p>
                            This includes the tokens used for the context (every
                            message before the current one is sent to the
                            model).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-muted-foreground -ml-1">
                      ) tokens
                    </span>
                  </div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <DollarSign className="size-3 inline-block" />
                <NumberFlow
                  value={Number(message.cost ?? 0)}
                  prefix="$"
                  format={{
                    maximumFractionDigits: 6,
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
