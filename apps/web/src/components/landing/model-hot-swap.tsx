"use client";

import {
  recommendedAccurateModel,
  recommendedCheapAndFastModel,
  recommendedGoodBalanceModel,
} from "@itzam/server/ai/recommended-models";
import {
  ModelWithCostAndProvider,
  ModelWithProvider,
  getAvailableModelsWithCost,
} from "@itzam/server/db/model/actions";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  LetterText,
  Loader2,
  Pencil,
  Sparkle,
  Sparkles,
  XIcon,
} from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "~/lib/utils";
import { FeaturedModel } from "../model/featured-model";
import { ModelDetails } from "../model/model-details";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Spinner } from "../ui/spinner";
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { SlugCard } from "../workflows/slug-card";
import { groupModelsByProviderAndSort } from "~/lib/providers";
const initialPrompt = `You are a helpful assistant that can answer questions and help with tasks.

Be polite and helpful.

Don't be harmful or offensive.
`;

export const ModelHotSwap = () => {
  const [model, setModel] = useState<ModelWithCostAndProvider | null>(null);
  const [models, setModels] = useState<ModelWithCostAndProvider[]>([]);
  const [prompt, setPrompt] = useState<string>(initialPrompt);

  const handleModelChange = (model: ModelWithCostAndProvider) => {
    setModel(model);
  };

  useEffect(() => {
    const fetchModels = async () => {
      const models = await getAvailableModelsWithCost();

      setModels(models);

      const defaultModel = models.find(
        (m) => m.tag === recommendedCheapAndFastModel,
      );

      if (defaultModel) {
        setModel(defaultModel);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">
        <SlugCard workflowSlug={"acme-customer-support"} />

        <ModelCard
          model={model ?? undefined}
          models={models}
          setModel={handleModelChange}
        />
      </div>
      <PromptCard initialPrompt={prompt} setPrompt={setPrompt} />
      <LastRuns model={model ?? null} />
    </div>
  );
};

type Run = {
  status: "success" | "error" | "running";
  createdAt: Date;
  input: string;
  cost: number;
  modelTag: string;
  modelName: string;
  duration: number;
};

export function LastRuns({ model }: { model: ModelWithProvider | null }) {
  const [lastRuns, setLastRuns] = useState<Run[]>([
    {
      status: "running",
      createdAt: new Date(),
      input: "What does 42 mean?",
      cost: 0.0,
      modelTag: "google:gemini-2.0-flash",
      modelName: "Gemini 2.0 Flash",
      duration: 242,
    },
    {
      status: "success",
      createdAt: new Date(Date.now() - 1000 * 20 * 60 * 24),
      input: "What Acme is?",
      cost: 0.05,
      modelTag: "openai:gpt-4o",
      modelName: "GPT-4o",
      duration: 532,
    },
    {
      status: "error",
      createdAt: new Date(Date.now() - 1000 * 60 * 22 * 24 * 2),
      input: "How can I contact Acme?",
      cost: 0.0,
      modelTag: "anthropic:claude-3-7-sonnet",
      modelName: "Claude 3.7 Sonnet",
      duration: 124,
    },
    {
      status: "success",
      createdAt: new Date(Date.now() - 1000 * 22 * 60 * 24 * 3),
      input: "What are the links to the Acme website?",
      cost: 0.01,
      modelTag: "anthropic:claude-3-7-sonnet",
      modelName: "Claude 3.7 Sonnet",
      duration: 324,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRuns((prev) => {
        const randomCost = Math.random() * 0.05;
        const randomDuration = Math.random() * 1000;

        // Remove the last run and 3. Add a new running run
        return [
          {
            status: "running" as const,
            createdAt: new Date(),
            input: "What does 42 mean?",
            cost: randomCost,
            modelTag: model?.tag ?? "anthropic:claude-3-7-sonnet",
            modelName: model?.name ?? "Claude 3.7 Sonnet",
            duration: randomDuration,
          },
          ...prev.slice(0, -1),
        ];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [model]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRuns((prev) => {
        // Update any running status to success
        return prev.map((run) => {
          if (run.status === "running") {
            return { ...run, status: "success" };
          }
          return run;
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="col-span-2 mt-4 flex flex-col">
      <div className="mb-4 hidden items-center gap-2 overflow-hidden border-border border-b px-6 py-2 text-muted-foreground text-sm md:flex">
        <p className="w-28">Status</p>
        <p className="w-48">Date</p>
        <p className="w-60">Model</p>
        <p className="w-96">Input</p>
        <p className="w-36">Cost</p>
        <p className="w-24">Duration</p>
      </div>
      <div className="flex h-48 flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {lastRuns.map((run) => (
            <motion.div
              key={run.createdAt.toISOString()}
              initial={{ opacity: 0, height: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mx-2 shadow-sm">
                <CardContent className="px-4 py-3 text-sm md:text-base">
                  <div className="flex items-center gap-8 overflow-hidden md:gap-2">
                    <div className="w-28 pl-2">
                      <Badge
                        className="flex size-5 items-center justify-center rounded-md p-1"
                        variant={
                          run.status === "success"
                            ? "green"
                            : run.status === "error"
                              ? "red"
                              : "gray"
                        }
                      >
                        {run.status === "success" ? (
                          <CheckIcon className="size-4 text-green-500" />
                        ) : run.status === "error" ? (
                          <XIcon className="size-4 text-red-500" />
                        ) : (
                          <Loader2 className="size-4 animate-spin text-sky-500" />
                        )}
                      </Badge>
                    </div>

                    <div className="w-48">
                      <p className="truncate text-sm text-muted-foreground">
                        {formatDate(run.createdAt)}
                      </p>
                    </div>

                    <div className="flex w-60 items-center gap-2">
                      <ModelIcon tag={run.modelTag} size="xs" />
                      <p className="truncate text-sm">{run.modelName}</p>
                    </div>
                    <div className="w-96">
                      <p className="truncate text-sm">{run.input}</p>
                    </div>
                    <div className="w-36">
                      <p className="text-sm text-muted-foreground">
                        ${run.cost.toFixed(4)}
                      </p>
                    </div>
                    <div className="w-24">
                      <p className="text-sm text-muted-foreground">
                        {run.duration.toFixed(0)}ms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function PromptCard({
  initialPrompt,
  setPrompt,
}: {
  initialPrompt: string;
  setPrompt: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPrompt, setNewPrompt] = useState(initialPrompt);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPrompt(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        toast.success("Prompt saved");
        setPrompt(newPrompt);
        setOpen(false);
      }, 200);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      toast.error("Failed to save prompt");
    }
  };

  return (
    <Card className="flex h-full flex-col shadow-sm">
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
                  value={newPrompt}
                  onChange={handlePromptChange}
                  rows={25}
                  className="resize-none"
                />
                <div className="absolute right-4 bottom-4">
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger>
                        <Button
                          variant="outline"
                          size="xs"
                          className="w-32"
                          onClick={() => {
                            toast.success(
                              "Enhance your prompts with AI inside the dashboard",
                            );
                          }}
                        >
                          <Sparkle className="size-3" />
                          <p className="text-xs">Enhance with AI</p>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Enhance your prompts with AI inside the dashboard
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

export function ModelCard({
  model,
  models,
  setModel,
}: {
  model: ModelWithProvider | undefined;
  models: ModelWithProvider[];
  setModel: (model: ModelWithProvider) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    model?.id,
  );
  const [isLoading, setIsLoading] = useState(false);

  if (!model) {
    return null;
  }

  const featuredModels = models.filter(
    (m) =>
      m.tag === recommendedCheapAndFastModel ||
      m.tag === recommendedAccurateModel ||
      m.tag === recommendedGoodBalanceModel,
  );

  const handleSwitchModel = async () => {
    if (!selectedModelId || selectedModelId === model.id) {
      setOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      setModel(models.find((m) => m.id === selectedModelId)!);
      toast.success("Model updated");

      setOpen(false);
    } catch {
      toast.error("Failed to update model");
    } finally {
      setIsLoading(false);
    }
  };

  const sortedModels = groupModelsByProviderAndSort(models);

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <p>Model</p>
          <Sparkles className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ModelIcon tag={model.tag} size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-tight">
                {model.name}
              </h3>
            </div>
            <span className="text-muted-foreground text-xs">
              {model.provider?.name ||
                (model.providerId
                  ? `Provider ID: ${model.providerId}`
                  : "Unknown provider")}
            </span>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline">
              <Pencil className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            className="!outline-none !focus:outline-none !focus:ring-0 sm:max-w-4xl"
            style={{ outline: "none" }}
            tabIndex={-1}
          >
            <DialogHeader className="space-y-1">
              <DialogTitle>Switch Model</DialogTitle>
              <DialogDescription>
                Select a different model for this workflow.
              </DialogDescription>
            </DialogHeader>

            {featuredModels.length > 0 && (
              <div className="flex w-full items-center gap-3">
                {featuredModels.map((m) => (
                  <FeaturedModel
                    key={m.id}
                    model={m}
                    selectedModel={
                      models.find((model) => model.id === selectedModelId) ||
                      model
                    }
                    setSelectedModel={(selectedModel) =>
                      setSelectedModelId(selectedModel.id)
                    }
                  />
                ))}
              </div>
            )}

            <ScrollArea className="mt-4 h-[360px] pr-4">
              <div className="space-y-5">
                {sortedModels.map(({ providerName, models }) => (
                  <div key={providerName}>
                    <h4 className="mb-2 ml-2 flex items-center gap-1.5 font-medium text-sm">
                      <ProviderIcon
                        id={models[0]?.providerId ?? ""}
                        size="sm"
                      />
                      {providerName}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {models.map((m) => (
                        <ModelDetails
                          key={m.id}
                          model={m}
                          selectedModelId={selectedModelId ?? ""}
                          setSelectedModelId={setSelectedModelId}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSwitchModel}
                disabled={isLoading || selectedModelId === model.id}
                size="sm"
                className="w-40"
              >
                {isLoading ? <Spinner /> : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
