"use client";

import { recommendedAccurateModel } from "@itzam/server/ai/recommended-models";
import {
  ModelWithCostAndProvider,
  getAvailableModelsWithCost,
} from "@itzam/server/db/model/actions";
import { motion } from "framer-motion";
import {
  BarChart,
  Loader2,
  MessageSquareTextIcon,
  Play,
  RefreshCcw,
} from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import ChangeModel from "../playground/change-model";
import { BorderTrail } from "../ui/border-trail";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";

const exampleResponses = [
  "Hello! I'm here to help you with your account. What problem are you having?",
  "I'm sorry to hear that you're having trouble with your account. What seems to be the problem?",
  "I'm here to help you with your account. What problem are you having?",
];

export const PlaygroundCard = () => {
  const [prompt, setPrompt] = useState(
    "You are a helpful customer support assistant. Be concise and to the point. Do not add any extra information."
  );
  const [input, setInput] = useState(
    "Hey! I'm having trouble with my account."
  );

  const [model, setModel] = useState<ModelWithCostAndProvider | null>(null);
  const [models, setModels] = useState<ModelWithCostAndProvider[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);

  const fakeSubmit = () => {
    setIsPending(true);
    setOutput(null);
    setRunId(null);

    setTimeout(() => {
      setIsPending(false);
      setRunId(Math.random().toString(36).substring(2, 15));

      setOutput(
        exampleResponses[Math.floor(Math.random() * exampleResponses.length)] ??
          null
      );
    }, 1000);
  };

  const handleSync = () => {
    toast.success("You can sync the playground changes to your workflow");
  };

  useEffect(() => {
    const fetchModels = async () => {
      const models = await getAvailableModelsWithCost();
      setModels(models);

      const defaultModel = models.find(
        (m) => m.tag === recommendedAccurateModel
      );

      if (defaultModel) {
        setModel(defaultModel);
      }
    };

    fetchModels();
  }, []);

  return (
    <Card className="p-8 shadow-sm">
      <BorderTrail
        color="neutral"
        duration={20}
        size={0}
        style={{
          boxShadow:
            "0px 0px 60px 30px rgb(128 128 128 / 50%), 0 0 100px 60px rgb(96 96 96 / 50%), 0 0 140px 90px rgb(64 64 64 / 50%)",
        }}
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex h-full flex-col gap-4">
          <div className="relative flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="font-medium">Customer Support</h1>
              <p className="text-muted-foreground/50 text-sm">
                CS AI Agent for Acme Inc.
              </p>
            </div>
            <div className="absolute top-0 right-0">
              <Button
                variant="outline"
                size="xs"
                className="px-3"
                onClick={handleSync}
              >
                <RefreshCcw className="size-3" />
                <span className="hidden sm:inline">Sync</span>
              </Button>
            </div>
          </div>
          <div className="mt-2 space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="model"
                className="flex items-center font-normal text-muted-foreground text-sm"
              >
                Model
              </Label>
              <div className="flex items-center gap-2">
                <ModelIcon tag={model?.tag ?? ""} size="sm" />
                <p className="font-medium text-sm">{model?.name ?? ""}</p>
                <ChangeModel models={models} setModel={setModel} />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="prompt"
                className="font-normal text-muted-foreground text-sm"
              >
                System Prompt
              </Label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt here..."
                value={prompt}
                className="min-h-[160px]"
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="input-text"
                className="font-normal text-muted-foreground text-sm"
              >
                User Input
              </Label>
              <Textarea
                id="input-text"
                placeholder="Enter your input text here..."
                className="min-h-[120px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <Button
            onClick={fakeSubmit}
            disabled={!input.trim() || isPending}
            className="mt-4 w-full"
            size="sm"
            variant="primary"
          >
            {isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <>
                Generate
                <Play className="size-2" fill="currentColor" />
              </>
            )}
          </Button>
        </div>

        <div className="col-span-1 flex h-full flex-col gap-4 md:col-span-2">
          <DetailsCard runId={runId} isPending={isPending} />
          <ResponseCard output={output ?? ""} isPending={isPending} />
        </div>
      </div>
    </Card>
  );
};

export function DetailsCard({
  runId,
  isPending,
}: {
  runId: string | null;
  isPending: boolean;
}) {
  const randomDuration = Math.floor(Math.random() * 1000);
  const randomCost = Math.floor(Math.random() * 1000);
  const randomInputTokens = Math.floor(Math.random() * 1000);
  const randomOutputTokens = Math.floor(Math.random() * 1000);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        {runId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-muted-foreground text-sm">Duration</h4>
                  <div className="mt-1">
                    <p className="text-sm">{randomDuration + "ms"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-muted-foreground text-sm">Cost</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm">{`$0.0${randomCost}`}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-muted-foreground text-sm">
                    Input Tokens
                  </h4>
                  <p className="mt-1 text-sm">{randomInputTokens}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-muted-foreground text-sm">
                    Output Tokens
                  </h4>
                  <p className="mt-1 text-sm">{randomOutputTokens}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : isPending ? (
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex gap-4 ">
              <Skeleton className="h-[12px] w-full" />
              <Skeleton className="h-[12px] w-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-[12px] w-full" />
              <Skeleton className="h-[12px] w-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-[12px] w-full" />
              <Skeleton className="h-[12px] w-full" />
            </div>
          </div>
        ) : (
          <EmptyStateDetails
            title="No details to show"
            description="Run the workflow to see the response"
            icon={<BarChart />}
            className="my-4"
          />
        )}
      </CardContent>
    </Card>
  );
}

export function ResponseCard({
  output,
  isPending,
}: {
  output: string;
  isPending: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle>Response</CardTitle>
      </CardHeader>

      <CardContent>
        {output ? (
          <div className="whitespace-pre-wrap text-sm">{output}</div>
        ) : isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-[12px] w-32" />
            <Skeleton className="h-[12px] w-2/3" />
            <Skeleton className="h-[12px] w-1/2" />
          </div>
        ) : (
          <div className="my-28 flex items-center justify-center">
            <EmptyStateDetails
              title="No response yet"
              description="Test your workflow by clicking the generate button"
              icon={<MessageSquareTextIcon />}
              className="flex items-center justify-center"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
