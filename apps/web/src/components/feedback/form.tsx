"use client";

import { sendDiscordNotification } from "@itzam/server/discord/actions";
import { Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import { useCurrentUser } from "~/hooks/useCurrentUser";

const TRANSITION_CONTENT = {
  ease: "easeOut",
  duration: 0.2,
};

type FeedbackFormProps = {
  onClose: () => void;
};

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState("");

  const { user } = useCurrentUser();

  useEffect(() => {
    setStatus("idle");
    setFeedback("");
  }, []);

  const handleClose = () => {
    setFeedback("");
    setStatus("idle");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatus("submitting");
    if (!feedback.trim()) return;

    try {
      await sendDiscordNotification({
        content: `New feedback submitted by ${user?.email}: ${feedback}`,
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setStatus("success");

      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="h-[200px] w-full">
      <AnimatePresence mode="popLayout">
        {status === "success" ? (
          <motion.div
            key="success"
            className="flex h-[200px] w-full flex-col items-center justify-center"
            initial={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(2px)" }}
            transition={TRANSITION_CONTENT}
          >
            <div className="rounded-full bg-green-500/10 p-1">
              <Check className="size-4 text-green-500" />
            </div>
            <p className="text-foreground mt-3 mb-1 text-center text-sm font-medium">
              Thank you for your time!
            </p>
            <p className="text-muted-foreground text-sm">
              Your feedback makes Itzam better.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className="flex h-full flex-col bg-background"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: -10, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(2px)" }}
            transition={TRANSITION_CONTENT}
          >
            <Textarea
              className="text-foreground h-full w-full resize-none shadow-none border-none p-4 text-sm outline-hidden focus-visible:ring-0"
              autoFocus
              placeholder="What would make Itzam better for you?"
              onChange={(e) => setFeedback(e.target.value)}
              disabled={status === "submitting"}
            />
            <div key="close" className="flex justify-between p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                aria-label="Close"
                disabled={status === "submitting"}
              >
                <X className="text-foreground size-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Link href="https://cal.com/gustavo-fior/30min" target="_blank">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Call founders"
                    disabled={status === "submitting"}
                  >
                    Call founders
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  aria-label="Submit feedback"
                  disabled={status === "submitting" || !feedback.trim()}
                >
                  <AnimatePresence mode="popLayout">
                    {status === "submitting" ? (
                      <motion.span
                        key="submitting"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={TRANSITION_CONTENT}
                        className="inline-flex items-center gap-2"
                      >
                        <Spinner />
                        Sending...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="send"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={TRANSITION_CONTENT}
                      >
                        Send
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
