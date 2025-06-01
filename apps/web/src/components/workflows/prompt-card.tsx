"use client";
import { updateWorkflowPrompt } from "@itzam/server/db/workflow/actions";
import { enhancePrompt } from "@itzam/server/itzam/prompt-enhancer";
import { LetterText, Sparkle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function PromptCard({
  initialPrompt,
  workflowId,
}: {
  initialPrompt: string;
  workflowId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateWorkflowPrompt(workflowId, prompt);
      setIsLoading(false);
      toast.success("Prompt saved");
      setOpen(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast.error("Failed to save prompt");
    }
  };

  const enhancePromptWithAI = async () => {
    setIsGeneratingPrompt(true);
    const response = await enhancePrompt(prompt);

    if ("error" in response) {
      toast.error(response.error, {
        description: response.description,
      });
      setIsGeneratingPrompt(false);
      return;
    }

    setPrompt("");

    for await (const chunk of response.stream) {
      setPrompt((prev) => prev + chunk);
    }

    setIsGeneratingPrompt(false);
  };

  const canGeneratePrompt = prompt && prompt.length > 20;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <p>Prompt</p>
          <LetterText className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-[12] flex-1 whitespace-pre-wrap break-words font-mono text-muted-foreground text-xs">
          {initialPrompt}
        </p>
        <div className="mt-2 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                disabled={isLoading}
              >
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-4xl max-w-4xl">
              <DialogHeader>
                <DialogTitle>Edit Prompt</DialogTitle>
                <DialogDescription>
                  This will change the current prompt of your workflow, be
                  careful.
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={handlePromptChange}
                  rows={25}
                  disabled={isGeneratingPrompt}
                  className="resize-none"
                />
                <div className="absolute right-4 bottom-4">
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="xs"
                          className="w-32"
                          onClick={enhancePromptWithAI}
                          disabled={!canGeneratePrompt || isGeneratingPrompt}
                        >
                          {isGeneratingPrompt ? (
                            <Spinner />
                          ) : (
                            <>
                              <Sparkle className="size-3" />
                              <p className="text-xs">Enhance with AI</p>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canGeneratePrompt
                          ? "Enhance your prompt with AI"
                          : "Write a prompt with at least 20 characters"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <DialogFooter>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isLoading}
                    size="sm"
                    variant="primary"
                    className="flex w-32 items-center justify-center"
                    onClick={handleSave}
                  >
                    {isLoading ? <Spinner /> : "Save"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
