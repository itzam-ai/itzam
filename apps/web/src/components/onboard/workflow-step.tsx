import {
  getAvailableModelsBasedOnUserKeys,
  ModelWithCostAndProvider,
} from "@itzam/server/db/model/actions";
import { ProviderKey } from "@itzam/server/db/provider-keys/actions";
import { createWorkflow } from "@itzam/server/db/workflow/actions";
import { generatePrompt } from "@itzam/server/itzam/prompt-generator";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Info, Loader2 } from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { generateSlug } from "../workflows/create-workflow-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export type MiniWorkflow = {
  id: string;
  name: string;
  description: string;
  slug: string;
  prompt: string;
  modelId: string;
};

export const WorkflowDetailsStep = ({
  handleNextStep,
  handlePreviousStep,
  setWorkflow,
  providerKeys,
}: {
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  setWorkflow: (workflow: MiniWorkflow) => void;
  providerKeys: ProviderKey[];
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<ModelWithCostAndProvider | null>(null);
  const [models, setModels] = useState<ModelWithCostAndProvider[]>([]);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  const handleSetModel = (model: ModelWithCostAndProvider) => {
    setSelectedModel(model);
  };

  const handleCreateWorkflow = async () => {
    setIsCreatingWorkflow(true);
    const prompt = await generatePrompt(name, description);

    const workflow = await createWorkflow({
      name,
      description,
      slug,
      prompt,
      modelId: selectedModel?.id ?? "",
    });

    if (workflow && "error" in workflow) {
      console.error(workflow.error);
      return;
    }

    if (workflow) {
      setWorkflow({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description ?? "",
        slug: workflow.slug,
        prompt: workflow.prompt,
        modelId: workflow.modelId,
      });
    }
    setIsCreatingWorkflow(false);
  };

  useEffect(() => {
    const getModels = async () => {
      const models = await getAvailableModelsBasedOnUserKeys();
      setModels(models);
      setSelectedModel(models[0] ?? null);
    };

    getModels();
  }, [providerKeys]);

  if (!selectedModel) {
    return null;
  }

  return (
    <div className="max-w-xl w-full">
      <h2 className="text-lg font-medium flex items-center gap-2 select-none">
        Workflow{" "}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3 text-muted-foreground/60 mt-0.5 cursor-pointer hover:text-muted-foreground transition-colors duration-200" />
            </TooltipTrigger>
            <TooltipContent>
              <p>A workflow is a task that you want to do with AI.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Now, let&apos;s create you first workflow.
      </p>

      <div className="flex flex-col gap-6 mt-8">
        <div className="flex flex-col">
          <p className="font-medium text-sm ml-1">Name</p>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(generateSlug(e.target.value));
            }}
            placeholder="Acme Chatbot"
            className="w-full text-sm mt-2"
          />
          <AnimatePresence>
            {name && (
              <motion.p
                initial={{
                  opacity: 0,
                  height: 0,
                  filter: "blur(2px)",
                  marginTop: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  filter: "blur(0px)",
                  marginTop: 8,
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  filter: "blur(2px)",
                  marginTop: 0,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="text-muted-foreground text-xs"
              >
                Slug:{" "}
                <span className="font-mono text-foreground select-none pointer-events-none">
                  {generateSlug(name)}
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm ml-1">
            Description{" "}
            <span className="text-xs text-muted-foreground/60 font-normal ml-1">
              optional
            </span>
          </p>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A chatbot that helps users with their questions"
            className="w-full text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm ml-1">Model</p>
          <div className="grid grid-cols-3 gap-2">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => handleSetModel(model)}
                className={cn(
                  "flex flex-col gap-0.5 border rounded-lg p-3 active:scale-[0.98] active:duration-75 active:ease-in-out px-3 shadow-sm cursor-pointer hover:bg-accent transition-all duration-200",
                  model.id === selectedModel?.id && "bg-muted"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <ModelIcon tag={model.tag} size="us" />
                  <p className="text-xs font-medium">{model.name}</p>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {model.provider?.name ?? "Unknown"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-12 items-center">
        <p className="text-muted-foreground/60 text-xs">
          Relax, you can change everything later in the dashboard.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousStep}
            disabled={isCreatingWorkflow}
          >
            <ArrowLeft className="size-3" strokeWidth={2.5} />
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="w-20"
            onClick={async () => {
              await handleCreateWorkflow();
              handleNextStep();
            }}
            disabled={!selectedModel || !name || isCreatingWorkflow || !slug}
          >
            {isCreatingWorkflow ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <>
                Next
                <ArrowRight className="size-3" strokeWidth={2.5} />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
