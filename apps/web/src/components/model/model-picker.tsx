"use client";

import {
  ModelWithProvider,
  updateCurrentModel,
} from "@itzam/server/db/model/actions";
import { ProviderKey } from "@itzam/server/db/provider-keys/actions";
import { ArrowRight, Brain, Code, Eye, Shuffle } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useState } from "react";
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

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-medium">Switch model</h2>
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
        <h4 className="flex items-center gap-2 font-medium text-sm w-64 ml-0.5">
          <ProviderIcon id={models[0]?.providerId ?? ""} size="sm" />
          {providerName}
        </h4>
        <div className="w-32">
          <p className="text-xs text-muted-foreground">Features</p>
        </div>
        <div className="w-24">
          <p className="text-xs text-muted-foreground">Input</p>
        </div>
        <div className="w-24">
          <p className="text-xs text-muted-foreground">Output</p>
        </div>
        <div className="w-28">
          <p className="text-xs text-muted-foreground">Context</p>
        </div>
        <div className="w-24">
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
    <div
      className={`w-full flex items-center justify-between pl-1 pr-2 border-b border-border pb-2 pt-1`}
    >
      <div className="flex">
        <div className="flex items-center gap-2 w-64">
          <ModelIcon tag={model.tag} size="xs" />
          <h3 className="font-medium text-xs">{model.name}</h3>
          {isCurrentModel && (
            <Badge variant="orange" size="sm" className="ml-0.5">
              Current
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 w-32">
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
        <div className="flex items-center gap-1 w-24">
          <p className="text-xs text-muted-foreground">
            {formatCurrency(Number(model.inputPerMillionTokenCost))}
          </p>
        </div>
        <div className="flex items-center gap-1 w-24">
          <p className="text-xs text-muted-foreground">
            {formatCurrency(Number(model.outputPerMillionTokenCost))}
          </p>
        </div>
        <div className="flex items-center gap-1 w-28">
          <p className="text-xs text-muted-foreground">
            {formatNumber(model.contextWindowSize)}
          </p>
        </div>
        <div className="flex items-center gap-1 w-24">
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
