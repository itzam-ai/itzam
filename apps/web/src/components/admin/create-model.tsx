"use client";

import { createModel } from "@itzam/server/db/model/actions";
import { Brain, Code, Eye, Plus } from "lucide-react";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";

type Provider = {
  id: string;
  name: string;
} | null;

export function CreateModel({ providers }: { providers: Provider[] }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelTag, setModelTag] = useState("");
  const [modelProviderId, setModelProviderId] = useState("");
  const [modelInputCost, setModelInputCost] = useState("");
  const [modelOutputCost, setModelOutputCost] = useState("");
  const [modelContextWindow, setModelContextWindow] = useState(0);
  const [modelHasReasoningCapability, setModelHasReasoningCapability] =
    useState(false);
  const [modelHasVision, setModelHasVision] = useState(false);
  const [modelIsOpenSource, setModelIsOpenSource] = useState(false);
  const [modelDeprecated, setModelDeprecated] = useState(false);
  const [modelMaxTemperature, setModelMaxTemperature] = useState("");
  const [modelDefaultTemperature, setModelDefaultTemperature] = useState("");
  const [modelMaxTokens, setModelMaxTokens] = useState(0);

  const handleUpdateModel = async () => {
    setIsLoading(true);

    await createModel({
      name: modelName,
      tag: modelTag,
      providerId: modelProviderId,
      inputPerMillionTokenCost: modelInputCost,
      outputPerMillionTokenCost: modelOutputCost,
      contextWindowSize: modelContextWindow,
      hasReasoningCapability: modelHasReasoningCapability,
      hasVision: modelHasVision,
      isOpenSource: modelIsOpenSource,
      deprecated: modelDeprecated,
      maxTemperature: modelMaxTemperature,
      defaultTemperature: modelDefaultTemperature,
      maxTokens: modelMaxTokens,
    });

    setIsLoading(false);
    setOpen(false);
    setModelName("");
    setModelTag("");
    setModelProviderId("");
    setModelInputCost("");
    setModelOutputCost("");
    setModelContextWindow(0);
    setModelHasReasoningCapability(false);
    setModelHasVision(false);
    setModelIsOpenSource(false);
    setModelDeprecated(false);
    setModelMaxTemperature("");
    setModelDefaultTemperature("");
    setModelMaxTokens(0);
    toast.success(`Model ${modelName} created`);
  };

  const isFormComplete =
    modelName &&
    modelTag &&
    modelProviderId &&
    modelInputCost &&
    modelOutputCost &&
    modelContextWindow &&
    modelMaxTemperature &&
    modelDefaultTemperature &&
    modelMaxTokens;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary">
          <Plus className="size-3" />
          Add Model
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Create Model</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <Input
              type="text"
              value={modelTag}
              onChange={(e) => setModelTag(e.target.value)}
            />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <Label>Deprecated</Label>
            <Switch
              className="mt-2"
              checked={modelDeprecated}
              onCheckedChange={(checked) => setModelDeprecated(checked)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Provider</Label>
          <Select
            value={modelProviderId}
            onValueChange={(value) => setModelProviderId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider?.id} value={provider?.id ?? ""}>
                  <div className="flex items-center gap-2">
                    <ProviderIcon id={provider?.id ?? ""} size="xs" />
                    {provider?.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>
              Input Cost{" "}
              <span className="text-muted-foreground text-xs">(1M tokens)</span>
            </Label>
            <Input
              type="text"
              value={modelInputCost ?? ""}
              onChange={(e) => setModelInputCost(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Output Cost{" "}
              <span className="text-muted-foreground text-xs">(1M tokens)</span>
            </Label>
            <Input
              type="text"
              value={modelOutputCost ?? ""}
              onChange={(e) => setModelOutputCost(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Context Window</Label>
            <Input
              type="text"
              value={modelContextWindow}
              onChange={(e) => setModelContextWindow(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Max Temperature</Label>
            <Input
              type="text"
              value={modelMaxTemperature ?? ""}
              onChange={(e) => setModelMaxTemperature(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Temperature</Label>
            <Input
              type="text"
              value={modelDefaultTemperature ?? ""}
              onChange={(e) => setModelDefaultTemperature(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="text"
              value={modelMaxTokens}
              onChange={(e) => setModelMaxTokens(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Capabilities</Label>
          <div className="grid grid-cols-3 gap-4">
            <div
              onClick={() =>
                setModelHasReasoningCapability(!modelHasReasoningCapability)
              }
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input py-4 text-center text-muted-foreground text-sm transition-all duration-200",
                modelHasReasoningCapability &&
                  "border-green-600 bg-green-600/10 text-primary"
              )}
            >
              <Brain className="inline-block size-3" /> Reasoning
            </div>

            <div
              onClick={() => setModelHasVision(!modelHasVision)}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input py-4 text-center text-muted-foreground text-sm transition-all duration-200",
                modelHasVision && "border-sky-600 bg-sky-600/10 text-primary"
              )}
            >
              <Eye className="size-3" /> Vision
            </div>

            <div
              onClick={() => setModelIsOpenSource(!modelIsOpenSource)}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input py-4 text-center text-muted-foreground text-sm transition-all duration-200",
                modelIsOpenSource &&
                  "border-orange-600 bg-orange-600/10 text-primary"
              )}
            >
              <Code className="size-3" /> Open Source
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateModel}
            size="sm"
            className="w-40"
            disabled={isLoading || !isFormComplete}
          >
            {isLoading ? <Spinner /> : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
