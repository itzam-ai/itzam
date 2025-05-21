"use client";

import {
  saveModelSettings,
  WorkflowWithModelSettingsAndModelAndProvider,
} from "@itzam/server/db/model-settings/actions";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter,
  AlignJustify,
  ArrowRight,
  InfoIcon,
  Palette,
  Ruler,
  Save,
  Scale,
  ScrollText,
  Settings2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatNumber } from "~/lib/utils";
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
import { Panel } from "../ui/panel";
import { Slider } from "../ui/slider";
import { Spinner } from "../ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ModelDescription } from "./model-description";

function getTemperaturePresetLabel(preset: string, customTemperature: string) {
  switch (preset) {
    case "STRICT":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <Ruler className="size-3" />
          Strict
        </div>
      );
    case "BALANCED":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <Scale className="size-3" />
          Balanced
        </div>
      );
    case "CREATIVE":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <Palette className="size-3" />
          Creative
        </div>
      );

    case "CUSTOM":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <Settings2 className="size-3" />
          Custom ({formatNumber(Number(customTemperature))})
        </div>
      );
    default:
      return preset;
  }
}

function getResponseLengthPresetLabel(
  preset: string,
  customResponseLength: number
) {
  switch (preset) {
    case "SHORT":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <AlignCenter className="size-3" />
          Short
        </div>
      );
    case "MEDIUM":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <AlignJustify className="size-3" />
          Normal
        </div>
      );
    case "LONG":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <ScrollText className="size-3" />
          Long
        </div>
      );
    case "CUSTOM":
      return (
        <div className="flex flex-row gap-1 items-center text-primary">
          <Settings2 className="size-3" />
          Custom ({formatNumber(customResponseLength)})
        </div>
      );
    default:
      return preset;
  }
}

export function ModelSettings({
  workflow,
}: {
  workflow: WorkflowWithModelSettingsAndModelAndProvider;
}) {
  const [newTemperaturePreset, setNewTemperaturePreset] = useState<
    "STRICT" | "BALANCED" | "CREATIVE" | "CUSTOM"
  >(workflow.modelSettings.temperaturePreset);

  const [newResponseLengthPreset, setNewResponseLengthPreset] = useState<
    "SHORT" | "MEDIUM" | "LONG" | "CUSTOM"
  >(workflow.modelSettings.maxTokensPreset);

  const modelDoesNotUseStandardTemperature =
    workflow.model.defaultTemperature.toString() !== "1" ||
    workflow.model.maxTemperature.toString() !== "2";

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

  const [customTemperature, setCustomTemperature] = useState(
    workflow.modelSettings.temperature
  );
  const [customResponseLength, setCustomResponseLength] = useState(
    workflow.modelSettings.maxTokens
  );

  // Add state for height animation
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto");
  const [shouldAnimateHeight, setShouldAnimateHeight] = useState(false);
  const [shouldMeasure, setShouldMeasure] = useState(true);

  // Add refs for content measurement
  const simpleContentRef = useRef<HTMLDivElement>(null);
  const advancedContentRef = useRef<HTMLDivElement>(null);

  // Add useEffect to sync state with props
  useEffect(() => {
    setNewTemperaturePreset(workflow.modelSettings.temperaturePreset);
    setNewResponseLengthPreset(workflow.modelSettings.maxTokensPreset);
    setCustomTemperature(workflow.modelSettings.temperature);
    setCustomResponseLength(workflow.modelSettings.maxTokens);
  }, [workflow.modelSettings]);

  const handleTemperatureChange = (
    temperature: "STRICT" | "BALANCED" | "CREATIVE" | "CUSTOM"
  ) => {
    setNewTemperaturePreset(temperature);

    const maxTemperature = Number(workflow.model.maxTemperature);

    if (temperature === "STRICT") {
      setCustomTemperature(String(maxTemperature * 0.25));
    } else if (temperature === "BALANCED") {
      setCustomTemperature(String(maxTemperature * 0.5));
    } else if (temperature === "CREATIVE") {
      setCustomTemperature(String(maxTemperature * 0.75));
    }
  };

  const handleResponseLengthChange = (
    responseLength: "SHORT" | "MEDIUM" | "LONG" | "CUSTOM"
  ) => {
    setNewResponseLengthPreset(responseLength);

    if (responseLength === "SHORT") {
      setCustomResponseLength(Math.floor(workflow.model.maxTokens / 4));
    } else if (responseLength === "MEDIUM") {
      setCustomResponseLength(Math.floor(workflow.model.maxTokens / 2));
    } else if (responseLength === "LONG") {
      setCustomResponseLength(workflow.model.maxTokens);
    }
  };

  const isDirty =
    (workflow.modelSettings.temperaturePreset !== newTemperaturePreset &&
      newTemperaturePreset !== "CUSTOM") ||
    (workflow.modelSettings.temperature !== customTemperature &&
      newTemperaturePreset === "CUSTOM") ||
    (workflow.modelSettings.maxTokensPreset !== newResponseLengthPreset &&
      newResponseLengthPreset !== "CUSTOM") ||
    (workflow.modelSettings.maxTokens !== customResponseLength &&
      newResponseLengthPreset === "CUSTOM");

  const handleSave = async () => {
    setIsLoading(true);
    await saveModelSettings({
      workflowId: workflow.id,
      modelSettingsId: workflow.modelSettings.id,
      modelId: workflow.model.id,
      temperature: customTemperature,
      maxTokens: customResponseLength,
      temperaturePreset: newTemperaturePreset,
      maxTokensPreset: newResponseLengthPreset,
    });
    setIsLoading(false);
    setOpen(false);
    toast.success("Model settings saved");
  };

  // Function to measure content height
  const measureCurrentContent = () => {
    const currentRef = isAdvancedSettingsOpen
      ? advancedContentRef.current
      : simpleContentRef.current;
    if (currentRef) {
      setContentHeight(currentRef.offsetHeight);
    }
  };

  // Measure on initial render and when settings change
  useEffect(() => {
    setShouldMeasure(true);
    const initialTimer = setTimeout(() => {
      measureCurrentContent();
    }, 50);
    return () => clearTimeout(initialTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdvancedSettingsOpen]);

  // Measure when content changes
  useEffect(() => {
    if (shouldMeasure) {
      measureCurrentContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldMeasure, newTemperaturePreset, customTemperature]);

  // Enable height animations after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimateHeight(true);
      measureCurrentContent();
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Current model</h2>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
          >
            <Settings2 className="size-3" />
            <span>
              {isAdvancedSettingsOpen ? "Simple Mode" : "Advanced Mode"}
            </span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm" disabled={!isDirty}>
                <Save className="size-3" />
                <span>Save</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className="!focus:outline-none !focus:ring-0 sm:max-w-[500px]"
              style={{ outline: "none" }}
              tabIndex={-1}
            >
              <DialogHeader>
                <DialogTitle>Save Model Settings</DialogTitle>
                <DialogDescription>
                  This will make these changes to the live model settings for
                  this workflow.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                {newTemperaturePreset !==
                  workflow.modelSettings.temperaturePreset && (
                  <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                    Style:{" "}
                    {getTemperaturePresetLabel(
                      workflow.modelSettings.temperaturePreset,
                      workflow.modelSettings.temperature
                    )}
                    <ArrowRight className="size-3" />
                    {getTemperaturePresetLabel(
                      newTemperaturePreset,
                      customTemperature
                    )}
                  </div>
                )}
                {newResponseLengthPreset !==
                  workflow.modelSettings.maxTokensPreset && (
                  <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                    Response Length:{" "}
                    {getResponseLengthPresetLabel(
                      workflow.modelSettings.maxTokensPreset,
                      workflow.modelSettings.maxTokens
                    )}
                    <ArrowRight className="size-3" />
                    {getResponseLengthPresetLabel(
                      newResponseLengthPreset,
                      customResponseLength
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isLoading}
                  size="sm"
                  className="w-20"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <div className="flex gap-2 items-center">
                      <Save className="size-3" />
                      Save
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="w-5/12">
          <ModelDescription workflow={workflow} />
        </div>

        <div className="w-7/12 space-y-4">
          <Panel
            title="Style"
            additionalInfo={
              workflow.modelSettings.temperaturePreset === "CUSTOM" &&
              newTemperaturePreset === "CUSTOM" && (
                <Badge variant="outline" size="sm">
                  Custom: {customTemperature}
                </Badge>
              )
            }
            caption={
              modelDoesNotUseStandardTemperature && (
                <div className="flex flex-row gap-2 items-center text-muted-foreground text-xs">
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger>
                        <InfoIcon className="size-3 hover:text-primary cursor-pointer transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        The default temperature for this model is not the middle
                        of the available range.
                        <br />
                        <br />
                        {`${workflow.model.provider.name}'s default: ${workflow.model.defaultTemperature}`}
                        <br />
                        <br />
                        Make changes carefully.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {`${workflow.model.provider.name}'s default: ${workflow.model.defaultTemperature}`}
                </div>
              )
            }
          >
            <motion.div
              layout
              initial={{ height: "auto" }}
              animate={{ height: contentHeight }}
              transition={{
                height: shouldAnimateHeight
                  ? { type: "spring", stiffness: 300, damping: 30 }
                  : { duration: 0 },
              }}
              className="overflow-hidden"
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
                {!isAdvancedSettingsOpen ? (
                  <motion.div
                    key="simple"
                    ref={simpleContentRef}
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{
                      opacity: {
                        duration: 0.2,
                      },
                    }}
                  >
                    <div className="flex flex-row gap-2 text-sm">
                      <SettingsButton
                        icon={<Ruler className="size-3" />}
                        title="Strict"
                        description="Deterministic and predictable."
                        isActive={newTemperaturePreset === "STRICT"}
                        onClick={() => handleTemperatureChange("STRICT")}
                        layoutId="selected-temperature"
                      />
                      <SettingsButton
                        icon={<Scale className="size-3" />}
                        title="Balanced"
                        description="Balanced and common."
                        isActive={newTemperaturePreset === "BALANCED"}
                        onClick={() => handleTemperatureChange("BALANCED")}
                        layoutId="selected-temperature"
                      />
                      <SettingsButton
                        icon={<Palette className="size-3" />}
                        title="Creative"
                        description="Creative and unpredictable."
                        isActive={newTemperaturePreset === "CREATIVE"}
                        onClick={() => handleTemperatureChange("CREATIVE")}
                        layoutId="selected-temperature"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="advanced"
                    ref={advancedContentRef}
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{
                      opacity: {
                        duration: 0.2,
                      },
                    }}
                  >
                    <div className="flex flex-col gap-2 p-2">
                      <h4 className="font-medium text-xs">Temperature</h4>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground text-xs">0</p>
                        <p className="text-muted-foreground text-xs">
                          {workflow.model.maxTemperature}
                        </p>
                      </div>
                      <Slider
                        value={[Number(customTemperature)]}
                        onValueChange={(value) => {
                          setNewTemperaturePreset("CUSTOM");
                          setCustomTemperature(value[0]?.toString() ?? "");
                        }}
                        min={0}
                        max={Number(workflow.model.maxTemperature)}
                        step={0.1}
                      />

                      <div className="relative mt-2 h-6">
                        {/* Strict marker - 20% */}
                        <div className="absolute left-[25%] -translate-x-1/2 flex flex-col items-center">
                          <Ruler className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            Strict
                          </span>
                        </div>
                        {/* Balanced marker - 50% */}
                        <div className="absolute left-[50%] -translate-x-1/2 flex flex-col items-center">
                          <Scale className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            Balanced
                          </span>
                        </div>
                        {/* Creative marker - 100% */}
                        <div className="absolute left-[75%] -translate-x-1/2 flex flex-col items-center">
                          <Palette className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            Creative
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Panel>

          <Panel
            title="Response Length"
            additionalInfo={
              workflow.modelSettings.maxTokensPreset === "CUSTOM" &&
              newResponseLengthPreset === "CUSTOM" && (
                <Badge variant="outline" size="sm">
                  Custom: {customResponseLength}
                </Badge>
              )
            }
          >
            <AnimatePresence mode="wait">
              {!isAdvancedSettingsOpen ? (
                <motion.div
                  key="simple"
                  ref={simpleContentRef}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{
                    opacity: {
                      duration: 0.2,
                    },
                  }}
                >
                  <div className="flex flex-row gap-2 text-sm">
                    <SettingsButton
                      icon={<AlignCenter className="size-3" />}
                      title="Short"
                      description="Short and direct to the point."
                      isActive={newResponseLengthPreset === "SHORT"}
                      onClick={() => handleResponseLengthChange("SHORT")}
                      layoutId="selected-response-length"
                    />
                    <SettingsButton
                      icon={<AlignJustify className="size-3" />}
                      title="Normal"
                      description="Normal length answers."
                      isActive={newResponseLengthPreset === "MEDIUM"}
                      onClick={() => handleResponseLengthChange("MEDIUM")}
                      layoutId="selected-response-length"
                    />
                    <SettingsButton
                      icon={<ScrollText className="size-3" />}
                      title="Long"
                      description="Long and detailed answers."
                      isActive={newResponseLengthPreset === "LONG"}
                      onClick={() => handleResponseLengthChange("LONG")}
                      layoutId="selected-response-length"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="advanced"
                  ref={advancedContentRef}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{
                    opacity: {
                      duration: 0.2,
                    },
                  }}
                >
                  <div className="flex flex-col gap-2 p-2">
                    <h4 className="font-medium text-xs">Max Tokens</h4>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground text-xs">0</p>
                      <p className="text-muted-foreground text-xs">
                        {formatNumber(workflow.model.maxTokens)}
                      </p>
                    </div>

                    <Slider
                      value={[Number(customResponseLength)]}
                      onValueChange={(value) => {
                        setNewResponseLengthPreset("CUSTOM");
                        setCustomResponseLength(value[0] ?? 0);
                      }}
                      min={0}
                      max={Number(workflow.model.maxTokens)}
                      step={1}
                    />

                    <div className="relative mt-2 h-6">
                      {/* Short marker - 20% */}
                      <div className="absolute left-[26%] -translate-x-1/2 flex flex-col items-center">
                        <AlignCenter className="size-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Short
                        </span>
                      </div>
                      {/* Normal marker - 50% */}
                      <div className="absolute left-[50%] -translate-x-1/2 flex flex-col items-center">
                        <AlignJustify className="size-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Normal
                        </span>
                      </div>
                      {/* Long marker - 100% */}
                      <div className="absolute left-[98%] -translate-x-1/2 flex flex-col items-center">
                        <ScrollText className="size-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          Long
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SettingsButton({
  icon,
  title,
  description,
  isActive,
  onClick,
  layoutId,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  layoutId: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full flex-col items-start py-2 px-3 text-left rounded-md text-card-foreground group`}
    >
      <h4
        className={`flex items-center gap-1.5 font-medium text-sm ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/60"} transition-colors z-10 `}
      >
        {icon} {title}
      </h4>
      <p
        className={`mt-1 text-muted-foreground text-xs z-10 ${isActive ? "text-primary" : "group-hover:text-primary/60"} transition-colors duration-200`}
      >
        {description}
      </p>
      {isActive && (
        <motion.div
          layoutId={layoutId}
          id={layoutId}
          className="absolute bottom-0 left-0 h-full w-full rounded-md bg-muted/70"
        />
      )}
    </button>
  );
}
