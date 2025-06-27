"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const CopySlugButton = ({ slug }: { slug: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Button
      variant="outline"
      className="flex items-center gap-2 px-3 py-1 text-xs h-6"
      onClick={() => {
        navigator.clipboard.writeText(slug);
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }}
    >
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check className="size-2.5" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Copy className="size-2.5" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="text-xs">{isCopied ? "Copied" : "Copy slug"}</span>
    </Button>
  );
};
