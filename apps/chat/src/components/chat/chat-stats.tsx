"use client";

import { getChatMetadata } from "@itzam/server/db/chat/actions";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { chatMetadataAtom, statsForNerdsAtom } from "~/lib/atoms";
import NumberFlow from "@number-flow/react";
import { Coins, DollarSign, MessageCircle, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export const ChatStats = ({ chatId }: { chatId: string }) => {
  const [statsForNerds] = useAtom(statsForNerdsAtom);
  const [chatMetadata, setChatMetadata] = useAtom(chatMetadataAtom);

  useEffect(() => {
    const fetchChatMetadata = async () => {
      const metadata = await getChatMetadata(chatId);
      setChatMetadata(metadata);
    };

    fetchChatMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  return (
    <AnimatePresence>
      {statsForNerds && (
        <motion.div
          initial={{ opacity: 0, height: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
          exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-start gap-4 text-sm"
        >
          <div className="flex flex-col gap-1">
            <p className="flex gap-1 items-center">
              <Coins className="size-3" />
              <span>Tokens</span>
            </p>
            <div className="flex gap-1 items-center">
              <span className="text-muted-foreground">Total:</span>{" "}
              <NumberFlow
                value={chatMetadata.tokensUsed}
                format={{
                  maximumFractionDigits: 2,
                }}
              />
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Info className="size-3 ml-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent
                    className="max-w-[300px]"
                    side="right"
                    sideOffset={12}
                  >
                    <p>
                      Tokens used in this chat.
                      <br />
                      <br />
                      This includes the tokens used for the context (every
                      message before the current one is sent to the model).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="flex gap-1 items-center">
              <DollarSign className="size-3" />
              <span>Cost</span>
            </p>

            <p>
              <span className="text-muted-foreground">Total:</span>{" "}
              <NumberFlow
                value={chatMetadata.cost}
                prefix="$"
                format={{
                  maximumFractionDigits: 6,
                }}
              />
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="flex gap-1 items-center">
              <MessageCircle className="size-3" />
              <span>Messages</span>
            </p>

            <p>
              <span className="text-muted-foreground">Total:</span>{" "}
              <NumberFlow value={chatMetadata.totalMessages} />
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
