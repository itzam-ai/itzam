"use client";

import {
  ModelWithProvider,
  updateCurrentModel,
} from "@itzam/server/db/model/actions";
import { ProviderKey } from "@itzam/server/db/provider-keys/actions";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Brain,
  Check,
  Code,
  Eye,
  Pin,
  Shuffle,
  X,
} from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { groupModelsByProviderAndSort } from "~/lib/providers";
import { formatCurrency, formatNumber } from "~/lib/utils";
import { Badge } from "../ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import Link from "next/link";
export function ModelPicker({
  models,
  currentModel,
  providerKeys,
  workflowId,
}: {
  models: ModelWithProvider[];
  currentModel: ModelWithProvider;
  workflowId: string;
  providerKeys: ProviderKey[];
}) {
  const [pinnedModels, setPinnedModels] = useState<ModelWithProvider[]>([
    currentModel,
  ]);
  const modelsSorted = groupModelsByProviderAndSort(models);

  const [shouldMeasure, setShouldMeasure] = useState(false);
  const [shouldAnimateHeight, setShouldAnimateHeight] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
  const pinnedModelsRef = useRef<HTMLDivElement>(null);
  const emptyModelsRef = useRef<HTMLDivElement>(null);

  const measureCurrentContent = () => {
    const currentRef = pinnedModelsRef.current
      ? pinnedModelsRef.current
      : emptyModelsRef.current;
    if (currentRef) {
      setContentHeight(currentRef.offsetHeight);
    }
  };

  useEffect(() => {
    setShouldMeasure(true);
    const initialTimer = setTimeout(() => {
      measureCurrentContent();
    }, 50);
    return () => clearTimeout(initialTimer);
  }, []);

  // Measure when content changes
  useEffect(() => {
    if (shouldMeasure) {
      measureCurrentContent();
    }
  }, [shouldMeasure, pinnedModels]);

  // Enable height animations after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimateHeight(true);
      measureCurrentContent();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-medium">Switch model</h2>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h4 className="flex items-center gap-2 font-medium text-sm ml-1">
              <Pin
                className="size-3 text-muted-foreground"
                fill="currentColor"
              />
              Pinned models
            </h4>
          </div>
          <motion.div
            initial={{ height: "auto" }}
            animate={{ height: contentHeight }}
            transition={{
              height: shouldAnimateHeight
                ? { type: "spring", stiffness: 300, damping: 30 }
                : { duration: 0 },
            }}
          >
            <AnimatePresence
              mode="wait"
              onExitComplete={() => {
                setTimeout(() => {
                  setShouldMeasure(true);
                  measureCurrentContent();
                }, 10);
              }}
            >
              {pinnedModels.length === 0 ? (
                <motion.div
                  key="empty"
                  ref={emptyModelsRef}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  className="text-muted-foreground border border-dashed border-border rounded-lg p-4"
                >
                  <p className="text-muted-foreground text-xs flex items-center gap-2">
                    <Pin className="size-3 text-muted-foreground rotate-45" />
                    Pin your favorite models to compare them side by side.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="pinned"
                  ref={pinnedModelsRef}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  className={`grid gap-4 grid-cols-${pinnedModels.length === 4 ? 4 : pinnedModels.length + 1}`}
                >
                  {pinnedModels.map((model) => (
                    <ModelPinnedCard
                      key={model.id}
                      model={model}
                      currentModel={currentModel}
                      pinnedModels={pinnedModels}
                      setPinnedModels={setPinnedModels}
                      workflowId={workflowId}
                    />
                  ))}
                  {pinnedModels.length < 4 && <EmptyModelCard />}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {modelsSorted.map(({ providerName, models }) => (
          <ProviderModelList
            key={providerName}
            models={models}
            currentModel={currentModel}
            providerName={providerName}
            pinnedModels={pinnedModels}
            setPinnedModels={setPinnedModels}
            workflowId={workflowId}
            providerKey={providerKeys.find(
              (key) => key.providerId === models[0]?.providerId
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ProviderModelList({
  models,
  currentModel,
  providerName,
  pinnedModels,
  setPinnedModels,
  workflowId,
  providerKey,
}: {
  models: ModelWithProvider[];
  currentModel: ModelWithProvider;
  providerName: string;
  pinnedModels: ModelWithProvider[];
  setPinnedModels: (models: ModelWithProvider[]) => void;
  workflowId: string;
  providerKey: ProviderKey | undefined;
}) {
  return (
    <div key={providerName}>
      <div className="flex items-center mb-3">
        <h4 className="flex items-center gap-2 font-medium text-sm w-52 ml-1">
          <ProviderIcon id={models[0]?.providerId ?? ""} size="sm" />
          {providerName}
        </h4>
        <div className="w-28" />
        <div className="flex items-center gap-1 w-20 ">
          <p className="text-xs text-muted-foreground">Input</p>
          <ArrowDown className="size-3 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1 w-20 ">
          <p className="text-xs text-muted-foreground">Output</p>
          <ArrowUp className="size-3 text-muted-foreground" />
        </div>
        <div className="w-24">
          <p className="text-xs text-muted-foreground">Context</p>
        </div>
        <div className="w-20">
          <p className="text-xs text-muted-foreground">Max Tokens</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 relative">
        {!providerKey && (
          <>
            <div className="absolute inset-0 backdrop-blur-[2px] bg-card/80 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground text-center flex gap-1.5">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <ProviderIcon id={models[0]?.providerId ?? ""} size="xs" />
                    {providerName}
                  </span>{" "}
                  API Key is not set.
                </p>
                <Link href="/dashboard/providers">
                  <Button variant="secondary" size="sm">
                    Add API Key
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
        {models.map((m) => (
          <ModelRow
            key={m.id}
            model={m}
            currentModel={currentModel}
            pinnedModels={pinnedModels}
            setPinnedModels={setPinnedModels}
            workflowId={workflowId}
          />
        ))}
      </div>
    </div>
  );
}

function ModelRow({
  model,
  currentModel,
  pinnedModels,
  setPinnedModels,
  workflowId,
}: {
  model: ModelWithProvider;
  currentModel: ModelWithProvider;
  pinnedModels: ModelWithProvider[];
  setPinnedModels: (models: ModelWithProvider[]) => void;
  workflowId: string;
}) {
  const isCurrentModel = model.id === currentModel.id;
  const isPinned = pinnedModels.some((m) => m.id === model.id);
  const maxPinnedReached = pinnedModels.length >= 4;
  const canPin = !maxPinnedReached || isPinned;

  return (
    <div
      className={`w-full flex items-center justify-between pl-1 pr-2 border-b border-border pb-2 pt-1 group`}
    >
      <div className="flex">
        <div className="flex items-center gap-2 w-52">
          <button
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200 mr-1"
            disabled={!canPin && !isPinned}
            onClick={(e) => {
              e.stopPropagation();
              setPinnedModels(
                isPinned
                  ? pinnedModels.filter((m) => m.id !== model.id)
                  : [...pinnedModels, model]
              );
            }}
          >
            <Pin
              className="size-3 text-muted-foreground"
              fill={isPinned ? "currentColor" : "none"}
            />
          </button>
          <ModelIcon tag={model.tag} size="xs" />
          <h3 className="font-medium text-xs">{model.name}</h3>
          {isCurrentModel && (
            <Badge variant="orange" size="sm">
              Current
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 w-28 ">
          {model.hasReasoningCapability && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="flex cursor-pointer items-center gap-1 rounded-md border border-green-600/20 bg-green-600/10 p-1 text-green-600 transition-all duration-200 hover:border-green-600/30 hover:bg-green-600/20">
                    <Brain className="size-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Thinks before answering</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {model.hasVision && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="flex cursor-pointer items-center gap-1 rounded-md border border-sky-600/20 bg-sky-600/10 p-1 text-sky-600 transition-all duration-200 hover:border-sky-600/30 hover:bg-sky-600/20">
                    <Eye className="size-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Vision capability (image input)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {model.isOpenSource && (
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger>
                  <div className="flex cursor-pointer items-center gap-1 rounded-md border border-orange-600/20 bg-orange-600/10 p-1 text-orange-600 transition-all duration-200 hover:border-orange-600/30 hover:bg-orange-600/20">
                    <Code className="size-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    The model is open source and available for anyone to use.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1 w-20 ">
          <p className="text-xs text-muted-foreground">
            {formatCurrency(Number(model.inputPerMillionTokenCost))}
          </p>
        </div>
        <div className="flex items-center gap-1 w-20   ">
          <p className="text-xs text-muted-foreground">
            {formatCurrency(Number(model.outputPerMillionTokenCost))}
          </p>
        </div>
        <div className="flex items-center gap-1 w-24 ">
          <p className="text-xs text-muted-foreground">
            {formatNumber(model.contextWindowSize)}
          </p>
        </div>
        <div className="flex items-center gap-1 w-20   ">
          <p className="text-xs text-muted-foreground">
            {formatNumber(model.maxTokens)}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        {!isCurrentModel && (
          <SwitchModelButton
            model={model}
            currentModel={currentModel}
            workflowId={workflowId}
          >
            <Button variant="outline" size="xs">
              <Shuffle className="size-3" />
              Switch
            </Button>
          </SwitchModelButton>
        )}
      </div>
    </div>
  );
}

function ModelPinnedCard({
  model,
  currentModel,
  pinnedModels,
  setPinnedModels,
  workflowId,
}: {
  model: ModelWithProvider;
  currentModel: ModelWithProvider;
  pinnedModels: ModelWithProvider[];
  setPinnedModels: (models: ModelWithProvider[]) => void;
  workflowId: string;
}) {
  const isCurrentModel = model.id === currentModel.id;

  return (
    <motion.div
      className="flex flex-col gap-2 w-full relative border rounded-lg p-4"
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      transition={{
        height: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{model.provider?.name}</p>
        <div className="flex items-center gap-2">
          <ModelIcon tag={model.tag} size="xs" />
          <h3 className="font-medium text-sm">{model.name}</h3>
        </div>
      </div>
      <Button
        variant="ghost"
        size="xs"
        onClick={() =>
          setPinnedModels(pinnedModels.filter((m) => m.id !== model.id))
        }
        className="absolute top-2 right-2 text-xs  text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <X className="size-3" fill="currentColor" />
      </Button>

      <div className={`w-full flex gap-2 text-start mt-2`}>
        <div className="flex flex-col gap-1 w-1/2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Input <ArrowDown className="size-3 text-muted-foreground" />
          </p>
          <p className="text-xs font-medium">
            {formatCurrency(Number(model.inputPerMillionTokenCost))}
            <span className="text-[10px] text-muted-foreground font-normal">
              {" "}
              /1M tokens
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Output <ArrowUp className="size-3 text-muted-foreground" />
          </p>
          <p className="text-xs font-medium">
            {formatCurrency(Number(model.outputPerMillionTokenCost))}
            <span className="text-[10px] text-muted-foreground font-normal">
              {" "}
              /1M tokens
            </span>
          </p>
        </div>
      </div>

      <div className="w-full flex gap-2 text-start mt-1">
        <div className="flex flex-col gap-1 w-1/2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Context
          </p>
          <p className="text-xs font-medium">
            {formatNumber(model.contextWindowSize)}
          </p>
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Max Tokens
          </p>
          <p className="text-xs font-medium">{formatNumber(model.maxTokens)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {model.hasReasoningCapability && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 rounded-md border border-green-600/20 bg-green-600/10 px-2 py-0.5 text-green-600 transition-all duration-200 hover:border-green-600/30 hover:bg-green-600/20">
                  <Brain className="size-3" />
                  <p className="font-medium text-[10px]">Reasoning</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Thinks before answering</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {model.hasVision && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 rounded-md border border-sky-600/20 bg-sky-600/10 px-2 py-0.5 text-sky-600 transition-all duration-200 hover:border-sky-600/30 hover:bg-sky-600/20">
                  <Eye className="size-3" />
                  <p className="font-medium text-[10px]">Vision</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vision capability (image input)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {model.isOpenSource && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 rounded-md border border-orange-600/20 bg-orange-600/10 px-2 py-0.5 text-orange-600 transition-all duration-200 hover:border-orange-600/30 hover:bg-orange-600/20">
                  <Code className="size-3" />
                  <p className="font-medium text-[10px]">Open Source</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The model is open source and available for anyone to use.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <SwitchModelButton
        model={model}
        currentModel={currentModel}
        workflowId={workflowId}
      >
        <Button
          variant="outline"
          className="w-full mt-2"
          size="sm"
          disabled={isCurrentModel}
        >
          {isCurrentModel ? (
            <div className="flex gap-2 items-center">
              <Check className="size-3" />
              Current
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <Shuffle className="size-3" />
              Switch
            </div>
          )}
        </Button>
      </SwitchModelButton>
    </motion.div>
  );
}

function EmptyModelCard() {
  return (
    <div className="border border-dashed border-border rounded-lg p-4 flex items-center justify-center">
      <p className="text-muted-foreground text-xs flex items-center gap-2 text-center flex-col">
        <Pin className="size-3 text-muted-foreground rotate-45" />
        Add up to 4 pinned models
      </p>
    </div>
  );
}

function SwitchModelButton({
  model,
  currentModel,
  workflowId,
  children,
}: {
  model: ModelWithProvider;
  currentModel: ModelWithProvider;
  workflowId: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setNewModel = async (model: ModelWithProvider) => {
    if (!model.provider?.id) {
      toast.error("Provider not found");
      return;
    }

    setIsLoading(true);

    try {
      await updateCurrentModel(workflowId, model.id, model.provider?.id);
      setOpen(false);
      toast.success("Model switched");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Error switching model"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="!focus:outline-none !focus:ring-0 sm:max-w-[500px]"
        style={{ outline: "none" }}
        tabIndex={-1}
      >
        <DialogHeader>
          <DialogTitle>Save Model Settings</DialogTitle>
          <DialogDescription>
            This will change the model for this workflow and reset the model
            settings.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm flex flex-row gap-1 items-center">
          Model: <ModelIcon tag={currentModel.tag} size="xs" className="ml-1" />
          {currentModel.name}
          <ArrowRight className="size-3" />
          <ModelIcon tag={model.tag} size="xs" className="ml-1" />
          {model.name}
        </p>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} size="sm">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setNewModel(model)}
            size="sm"
            className="w-20"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              <div className="flex gap-2 items-center">
                <Shuffle className="size-3" />
                Switch
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
