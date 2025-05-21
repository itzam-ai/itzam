"use client";

import { WorkflowWithModelSettingsAndModelAndProvider } from "@itzam/server/db/model-settings/actions";
import { formatNumber, formatCurrency } from "~/lib/utils";
import ModelIcon from "public/models/svgs/model-icon";
import { ArrowDown, ArrowUp, Brain, Code, Eye, InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function ModelDescription({
  workflow,
}: {
  workflow: WorkflowWithModelSettingsAndModelAndProvider;
}) {
  return (
    <div className="flex flex-col">
      <h1 className="text-muted-foreground text-sm">
        {workflow.model.provider?.name}
      </h1>
      <div className="flex items-center gap-2 mt-2">
        <ModelIcon size="sm" tag={workflow.model.tag} />
        <h1 className="font-semibold text-xl">{workflow.model.name}</h1>
      </div>

      <div className="w-full flex gap-2 text-start mt-6">
        <div className="flex flex-col gap-2 w-1/2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Input <ArrowDown className="size-3 text-muted-foreground" />
          </p>
          <p className="text-sm font-medium">
            {formatCurrency(Number(workflow.model.inputPerMillionTokenCost))}
            <span className="text-xs text-muted-foreground font-normal">
              {" "}
              /1M tokens
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Output <ArrowUp className="size-3 text-muted-foreground" />
          </p>
          <p className="text-sm font-medium">
            {formatCurrency(Number(workflow.model.outputPerMillionTokenCost))}
            <span className="text-xs text-muted-foreground font-normal">
              {" "}
              /1M tokens
            </span>
          </p>
        </div>
      </div>

      <div className="w-full flex gap-2 text-start mt-4">
        <div className="flex flex-col gap-2 w-1/2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Context Window
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger className="cursor-pointer">
                  <InfoIcon className="ml-1 size-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Max tokens the model can use to understand the context of the
                  conversation.
                  <br />
                  <br />
                  This is around{" "}
                  {formatNumber(
                    Math.floor(workflow.model.contextWindowSize * 0.75)
                  )}{" "}
                  English words.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <p className="text-sm font-medium">
            {formatNumber(workflow.model.contextWindowSize)}
            <span className="text-xs text-muted-foreground font-normal ml-2">
              ~
              {formatNumber(
                Math.floor(workflow.model.contextWindowSize * 0.75)
              )}{" "}
              words
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Max Tokens
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger className="cursor-pointer">
                  <InfoIcon className="ml-1 size-3 cursor-pointer text-muted-foreground transition-colors hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Max tokens the model can generate (answer) in a single
                  request.
                  <br />
                  <br />
                  This is around{" "}
                  {formatNumber(
                    Math.floor(workflow.model.maxTokens * 0.75)
                  )}{" "}
                  English words
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <p className="text-sm font-medium">
            {formatNumber(workflow.model.maxTokens)}
            <span className="text-xs text-muted-foreground font-normal ml-2">
              ~{formatNumber(Math.floor(workflow.model.maxTokens * 0.75))} words
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        {workflow.model.hasReasoningCapability && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 rounded-md border border-green-600/20 bg-green-600/10 px-2 py-1 text-green-600 transition-all duration-200 hover:border-green-600/30 hover:bg-green-600/20">
                  <Brain className="size-3" />
                  <p className="font-medium text-xs">Reasoning</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Thinks before answering</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {workflow.model.hasVision && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 rounded-md border border-sky-600/20 bg-sky-600/10 px-2 py-1 text-sky-600 transition-all duration-200 hover:border-sky-600/30 hover:bg-sky-600/20">
                  <Eye className="size-3" />
                  <p className="font-medium text-xs">Vision</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vision capability (image input)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {workflow.model.isOpenSource && (
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <div className="flex cursor-pointer items-center gap-1 rounded-md border border-orange-600/20 bg-orange-600/10 px-2 py-1 text-orange-600 transition-all duration-200 hover:border-orange-600/30 hover:bg-orange-600/20">
                  <Code className="size-3" />
                  <p className="font-medium text-xs">Open Source</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>The model is open source and available for anyone to use.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
