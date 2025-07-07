"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  recommendedAccurateModel,
  recommendedCheapAndFastModel,
  recommendedGoodBalanceModel,
} from "@itzam/server/ai/recommended-models";
import type { ModelWithProvider } from "@itzam/server/db/model/actions";
import {
  checkSlugAvailability,
  createWorkflow,
} from "@itzam/server/db/workflow/actions";
import { fillPrompt } from "@itzam/server/itzam/prompt-filler";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Sparkle } from "lucide-react";
import { useRouter } from "next/navigation";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { FeaturedModel } from "../model/featured-model";
import { ModelDetails } from "../model/model-details";
import { Spinner } from "../ui/spinner";
import { groupModelsByProviderAndSort } from "~/lib/providers";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  prompt: z.string().min(1, "Prompt is required"),
  slug: z.string().min(1, "Slug is required"),
  modelId: z.string().min(1, "Model is required"),
});

// Function to generate a slug from a string
export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with a single dash
    .trim();
};

export function CreateWorkflowDialog({
  children,
  models,
}: {
  children: React.ReactNode;
  models: ModelWithProvider[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(0);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelWithProvider | null>(
    null
  );
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      prompt: "",
      modelId: "",
    },
    mode: "onChange",
  });

  // Update slug when name changes
  useEffect(() => {
    const name = form.watch("name");
    if (name) {
      const generatedSlug = generateSlug(name);
      form.setValue("slug", generatedSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("name")]);

  // Check slug availability when slug changes
  useEffect(() => {
    const slug = form.watch("slug");
    if (slug) {
      const checkSlug = async () => {
        setIsCheckingSlug(true);
        try {
          const isAvailable = await checkSlugAvailability(slug);

          if (
            typeof isAvailable === "object" &&
            isAvailable &&
            "error" in isAvailable
          ) {
            toast.error("Error checking slug availability");
            console.error(isAvailable.error);
            return;
          }

          setIsSlugAvailable(isAvailable);
          if (!isAvailable) {
            form.setError("slug", {
              type: "manual",
              message: "This slug is already taken",
            });
          } else {
            form.clearErrors("slug");
          }
        } catch (error) {
          console.error("Error checking slug availability:", error);
        } finally {
          setIsCheckingSlug(false);
        }
      };

      const debounceTimer = setTimeout(checkSlug, 500);
      return () => clearTimeout(debounceTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("slug")]);

  const isFirstStepValid =
    form.watch("name") !== "" && isSlugAvailable && !isCheckingSlug;
  const isSecondStepValid = form.watch("prompt") !== "";
  const isThirdStepValid = form.watch("modelId") !== "";

  const goToNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (step === 1 && !isSlugAvailable) {
      toast.error("Please choose a different slug");
      return;
    }

    setDirection(1);
    if (step === 1) {
      setStep(2);
      setSelectedModel(null);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const goToPreviousStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDirection(-1);
    if (step === 3) {
      setStep(2);
      setSelectedModel(null);
    } else if (step === 2) {
      setStep(1);
    }
  };

  const resetFormAndClose = () => {
    setOpen(false);
    setStep(1);
    setSelectedModel(null);
    form.reset();
  };

  const generatePrompt = async (prompt: string) => {
    setIsGeneratingPrompt(true);
    try {
      const response = await fillPrompt(
        form.getValues("name"),
        prompt,
        form.getValues("description")
      );

      form.setValue("prompt", "");

      for await (const chunk of response.stream) {
        form.setValue("prompt", (form.getValues("prompt") ?? "") + chunk);
      }
    } catch (error) {
      toast.error("Error generating prompt");
      console.error(error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const workflow = await createWorkflow({
        ...values,
      });

      if (workflow && "error" in workflow) {
        throw new Error("Failed to create workflow");
      }

      toast.success("Workflow created");
      resetFormAndClose();
      router.push(`/dashboard/workflows/${workflow?.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error creating workflow"
      );
      console.error(error);
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "5%" : "-5%",
      filter: "blur(2px)",
      opacity: 0,
    }),
    center: {
      x: 0,
      filter: "blur(0px)",
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "5%" : "-5%",
      filter: "blur(2px)",
      opacity: 0,
    }),
  };

  const transition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  };

  // Make sure our motionDivProps are consistent across all steps
  const motionDivProps = {
    custom: direction,
    variants: slideVariants,
    initial: "enter",
    animate: "center",
    exit: "exit",
    transition,
    tabIndex: -1,
    className: "outline-none pointer-events-auto",
    style: { outline: "none" },
  };

  // Create refs to measure content height for each step
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  // State to track the current height
  const [contentHeight, setContentHeight] = useState<number | "auto">("auto"); // Increased initial height
  const [contentWidth, setContentWidth] = useState<number | "auto">("auto"); // Increased initial height

  // Keep track of whether we should animate height changes
  const [shouldAnimateHeight, setShouldAnimateHeight] = useState(false);
  const [shouldAnimateWidth, setShouldAnimateWidth] = useState(false);

  // Keep track of whether we need to measure
  const [shouldMeasure, setShouldMeasure] = useState(true);

  // Function to measure the height of the current step
  const measureCurrentStep = () => {
    const currentRef =
      step === 1
        ? step1Ref.current
        : step === 2
          ? step2Ref.current
          : step3Ref.current;

    if (currentRef) {
      setContentHeight(currentRef.offsetHeight);
      setContentWidth(currentRef.offsetWidth);
    }
  };

  const canGeneratePrompt =
    !isGeneratingPrompt &&
    ((form.watch("prompt") || form.watch("description")) as unknown as boolean);

  // Measure on initial render and when step changes
  useEffect(() => {
    setShouldMeasure(true);

    // Initial measurement with a delay to ensure rendering
    const initialTimer = setTimeout(() => {
      measureCurrentStep();
    }, 50);

    return () => clearTimeout(initialTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const formValuesChanged = useMemo(() => {
    return form.watch("name") || form.watch("prompt") || form.watch("modelId");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("name"), form.watch("prompt"), form.watch("modelId")]);

  // Measure when form values change
  useEffect(() => {
    if (shouldMeasure) {
      measureCurrentStep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldMeasure, formValuesChanged]);

  // Handle animation complete
  const onAnimationComplete = () => {
    setShouldMeasure(true);
    measureCurrentStep();
  };

  // Enable height animations after first render
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setShouldAnimateHeight(true);
        setShouldAnimateWidth(true);
        // Measure after we enable animations
        measureCurrentStep();
      }, 200); // Wait until dialog open animation completes

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sort models into featured and other categories
  const featuredModels = models.filter(
    (m) =>
      m.tag === recommendedCheapAndFastModel ||
      m.tag === recommendedAccurateModel ||
      m.tag === recommendedGoodBalanceModel
  );

  const sortedModels = groupModelsByProviderAndSort(models);

  useEffect(() => {
    if (step === 2) {
      // Focus on prompt input
      setTimeout(() => {
        const promptInput = document.getElementById("prompt");
        if (promptInput) {
          promptInput.focus();
          (promptInput as HTMLTextAreaElement).setSelectionRange(0, 0);
        }
      }, 300);
    }
  }, [step]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          // Reset when closed
          setTimeout(() => {
            setStep(1);
            setIsCheckingSlug(false);
            setIsSlugAvailable(true);
            setShouldAnimateHeight(false); // Disable animations for next open
            setContentHeight("auto"); // Reset to initial height
            setShouldAnimateWidth(false);
            setContentWidth("auto");
          }, 300);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className={`w-auto max-w-none overflow-hidden outline-none`}
        onFocus={(e) => e.currentTarget.blur()}
        style={{ outline: "none" }}
      >
        <motion.div
          layout
          initial={{ height: "auto", width: "auto" }} // Updated initial height
          animate={{ height: contentHeight, width: contentWidth }}
          transition={{
            height: shouldAnimateHeight
              ? { type: "spring" as const, stiffness: 300, damping: 30 }
              : { duration: 0 },
            width: shouldAnimateWidth
              ? { type: "spring" as const, stiffness: 300, damping: 30 }
              : { duration: 0 },
          }}
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 outline-none"
            >
              <AnimatePresence
                custom={direction}
                initial={false}
                mode="wait"
                onExitComplete={() => {
                  // Measure after exit animation completes
                  setTimeout(() => {
                    setShouldMeasure(true);
                    measureCurrentStep();
                  }, 10);
                }}
              >
                {step === 1 && (
                  <motion.div
                    ref={step1Ref}
                    key="step1"
                    {...motionDivProps}
                    className="w-full min-w-[400px] max-w-[400px]"
                    onAnimationComplete={onAnimationComplete}
                  >
                    <DialogHeader>
                      <DialogTitle>New Workflow</DialogTitle>
                    </DialogHeader>

                    <div className="my-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                autoComplete="off"
                                placeholder="Landing Page Chatbot"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Slug{" "}
                              {!isCheckingSlug && !isSlugAvailable && (
                                <span className="ml-1.5 text-red-500 text-xs">
                                  Already taken
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="landing-page-chatbot"
                                {...field}
                                onChange={(e) => {
                                  // Allow manual edits to the slug
                                  const value = e.target.value;
                                  const cleanedValue = generateSlug(value);
                                  field.onChange(cleanedValue);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Description
                              <span className="ml-1.5 text-muted-foreground text-xs">
                                Optional
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Landing page chatbot that helps customers with their questions."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={goToNextStep}
                        disabled={!isFirstStepValid}
                      >
                        Next <ArrowRight className="size-3" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    ref={step2Ref}
                    key="step2"
                    {...motionDivProps}
                    className="w-full min-w-[700px] max-w-[700px]"
                    onAnimationComplete={onAnimationComplete}
                  >
                    <DialogHeader className="flex flex-col">
                      <button
                        onClick={goToPreviousStep}
                        className="mb-2.5 flex flex-row items-center gap-0.5 text-muted-foreground text-sm transition-colors duration-100 hover:text-foreground"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <p>Back</p>
                      </button>
                      <DialogTitle>New Workflow</DialogTitle>
                    </DialogHeader>

                    <div className="my-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-end justify-between align-bottom">
                              <FormLabel className="mb-2">Prompt</FormLabel>

                              <TooltipProvider>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="xs"
                                      className="w-24"
                                      onClick={() =>
                                        generatePrompt(field.value)
                                      }
                                      disabled={!canGeneratePrompt}
                                    >
                                      {isGeneratingPrompt ? (
                                        <Spinner />
                                      ) : (
                                        <>
                                          <Sparkle className="size-3" />
                                          <p className="text-xs">
                                            Fill with AI
                                          </p>
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {canGeneratePrompt
                                      ? "Generate or enhance your prompt with AI"
                                      : "Add a prompt or description first"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <FormControl>
                              <Textarea
                                id="prompt"
                                placeholder="You are a helpful assistant that can answer questions and help with tasks."
                                rows={15}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              You can always change the prompt later
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={goToNextStep}
                        disabled={!isSecondStepValid}
                      >
                        Next <ArrowRight className="size-3" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    ref={step3Ref}
                    key="step3"
                    {...motionDivProps}
                    className="w-full min-w-[800px] max-w-[900px]"
                    onAnimationComplete={onAnimationComplete}
                  >
                    <DialogHeader className="flex flex-col">
                      <button
                        onClick={goToPreviousStep}
                        className="mb-2.5 flex flex-row items-center gap-0.5 text-muted-foreground text-sm transition-colors duration-100 hover:text-foreground"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <p>Back</p>
                      </button>
                      <DialogTitle>New Workflow</DialogTitle>
                    </DialogHeader>

                    <div className="my-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="modelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-4">
                                {featuredModels.length > 0 && (
                                  <div className="mb-4 flex w-full items-center gap-3">
                                    {featuredModels.map((m) => (
                                      <FeaturedModel
                                        key={m.id}
                                        model={m}
                                        selectedModel={selectedModel}
                                        setSelectedModel={(m) => {
                                          setSelectedModel(m);
                                          field.onChange(m.id);
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                                <ScrollArea className="h-[300px] pr-4">
                                  <div className="space-y-5">
                                    {sortedModels.map(
                                      ({ providerName, models }) => (
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
                                                selectedModelId={
                                                  selectedModel?.id ?? ""
                                                }
                                                setSelectedModelId={(id) => {
                                                  setSelectedModel(
                                                    models.find(
                                                      (m) => m.id === id
                                                    ) || null
                                                  );
                                                  field.onChange(id);
                                                }}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </ScrollArea>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-32"
                        size="sm"
                        disabled={
                          form.formState.isSubmitting ||
                          !isThirdStepValid ||
                          !form.formState.isValid
                        }
                      >
                        {form.formState.isSubmitting ? (
                          <Spinner />
                        ) : (
                          "Create Workflow"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
