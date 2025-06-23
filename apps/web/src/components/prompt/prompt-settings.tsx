"use client";

import { WorkflowWithModelSettingsAndModelAndProvider } from "@itzam/server/db/model-settings/actions";
import { getEnhancePromptUsage } from "@itzam/server/db/prompt/actions";
import { updateWorkflowPrompt } from "@itzam/server/db/workflow/actions";
import { enhancePrompt } from "@itzam/server/itzam/prompt-enhancer";
import { ArrowDown, Save, Sparkle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

export function PromptSettings({
  workflow,
  usage,
}: {
  workflow: WorkflowWithModelSettingsAndModelAndProvider;
  usage: Awaited<ReturnType<typeof getEnhancePromptUsage>>;
}) {
  const [newPrompt, setNewPrompt] = useState("");
  const [prompt, setPrompt] = useState(workflow.prompt);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateWorkflowPrompt(workflow.id, prompt);
      setIsLoading(false);
      toast.success("Prompt saved");
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast.error("Failed to save prompt");
    }
  };

  const enhancePromptWithAI = async () => {
    if (usage.isEnhancePromptLimitReached) {
      toast.error("You have reached the enhance prompt limit");
      return;
    }

    setIsGeneratingPrompt(true);
    const response = await enhancePrompt(prompt);

    if ("error" in response) {
      toast.error(response.error, {
        description: response.description,
      });
      setIsGeneratingPrompt(false);
      return;
    }

    setNewPrompt("");

    for await (const chunk of response.stream) {
      setNewPrompt((prev) => prev + chunk);
    }

    setIsGeneratingPrompt(false);
  };

  const promptIsNotLongEnough = prompt && prompt.length < 20;

  return (
    <Card className="p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium">Prompt</h1>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={enhancePromptWithAI}
                    disabled={
                      promptIsNotLongEnough || isGeneratingPrompt || isLoading
                    }
                  >
                    {isGeneratingPrompt ? (
                      <Spinner />
                    ) : (
                      <Sparkle className="size-3" />
                    )}
                    <p className="text-xs">Enhance with AI</p>
                    <span className="text-muted-foreground">
                      ({usage.enhancePromptCount}/{usage.enhancePromptLimit})
                    </span>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent
                hidden={
                  !promptIsNotLongEnough || usage.isEnhancePromptLimitReached
                }
              >
                {usage.isEnhancePromptLimitReached
                  ? "You have reached the enhance prompt limit"
                  : "Write a prompt with at least 20 characters to enhance it"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="w-24"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <>
                <Save className="size-3" />
                <p className="text-xs">Save</p>
              </>
            )}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {newPrompt && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
              marginBottom: 0,
              filter: "blur(10px)",
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              height: "auto",
              marginBottom: 16,
              filter: "blur(0px)",
              scale: 1,
              transition: {
                opacity: { delay: 0.3 },
                marginBottom: { delay: 0.2 },
                filter: { delay: 0.2 },
                scale: { delay: 0.2 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              marginBottom: 0,
              filter: "blur(10px)",
              scale: 0.95,
              transition: {
                height: { delay: 0.3 },
              },
            }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2 relative"
          >
            <h2 className="text-sm font-medium">New Prompt</h2>
            <Textarea value={newPrompt} rows={10} />
            <div className="flex justify-end gap-2 absolute bottom-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-24"
                onClick={() => setNewPrompt("")}
              >
                <X className="size-3" />
                <p className="text-xs">Discard</p>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPrompt(newPrompt);
                  setNewPrompt("");
                  handleSave();
                }}
              >
                <ArrowDown className="size-3" />
                <p className="text-xs">Use new prompt</p>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Textarea value={prompt} onChange={handlePromptChange} rows={25} />
    </Card>
  );
}
