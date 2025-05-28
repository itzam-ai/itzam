"use client";

import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { AnimatePresence } from "framer-motion";
import { Loader2, Play } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useState } from "react";
import ChangeModel from "~/components/playground/change-model";
import { DetailsCard } from "~/components/playground/details-card";
import { ResponseCard } from "~/components/playground/response-card";
import { SyncChangesToWorkflow } from "~/components/playground/sync-changes-to-workflow";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { Workflow } from "~/lib/workflows";

// Type for the metadata returned by the stream
type StreamMetadata = {
  runId: string;
  model: {
    name: string;
    tag: string;
  };
  inputTokens: number;
  outputTokens: number;
  durationInMs: number;
  cost: string;
};

export default function PlaygroundClient({
  workflow,
  models,
  workflowId,
  userId,
}: {
  workflow: Workflow;
  models: ModelWithCostAndProvider[];
  workflowId: string;
  userId: string;
}) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(workflow);
  const [input, setInput] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<
    "loading" | "streaming" | "completed" | "error" | null
  >(null);
  const [output, setOutput] = useState<string>("");
  const [prompt, setPrompt] = useState<string>(workflow?.prompt || "");
  const [model, setModel] = useState<ModelWithCostAndProvider | null>(
    workflow?.model || null
  );
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);

  const modelChanged = model?.id !== selectedWorkflow?.model?.id;
  const promptChanged = prompt !== selectedWorkflow?.prompt;

  const handleSyncSuccess = () => {
    if (selectedWorkflow) {
      setSelectedWorkflow({
        ...selectedWorkflow,
        model: model ?? selectedWorkflow.model,
        prompt: prompt,
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedWorkflow || !input.trim()) {
      return;
    }

    setIsPending(true);
    setOutput("");
    setMetadata(null);

    try {
      const response = await fetch(`/api/playground`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          prompt,
          modelId: model?.id,
          workflowId: selectedWorkflow.id,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      setStreamStatus("loading");
      setStreamStatus("streaming");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });

        // Check if this chunk contains metadata
        const metadataMatch = text.match(/<!-- METADATA: (.*?) -->/);
        if (metadataMatch && metadataMatch[1]) {
          try {
            const parsedMetadata = JSON.parse(
              metadataMatch[1]
            ) as StreamMetadata;
            setMetadata(parsedMetadata);
          } catch (error) {
            console.error("Error parsing metadata:", error);
          }
        }

        // Filter out metadata comments and only append actual text content
        const cleanText = text.replace(/\n\n<!-- METADATA:.*?-->/g, "");
        if (cleanText) {
          setOutput(cleanText);
        }
      }

      setIsPending(false);
      setStreamStatus("completed");
    } catch (error) {
      console.error("Error generating content:", error);
      setOutput("");
      setIsPending(false);
      setStreamStatus("error");
    }
  };

  return (
    <Card className="grid grid-cols-3 gap-8 p-6">
      <div className="flex h-full flex-col gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="model"
              className="text-muted-foreground text-sm font-normal ml-0.5"
            >
              Model
            </Label>
            {models.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">
                  No models available. Add a Provider Key to get started.
                </p>
                <Link href="/dashboard/providers">
                  <Button size="sm" variant="secondary">
                    Add Provider Key
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ModelIcon tag={model?.tag ?? ""} size="xs" />
                <p className="font-medium text-sm">{model?.name ?? ""}</p>
                <ChangeModel models={models} setModel={setModel} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="prompt"
              className="text-muted-foreground text-sm font-normal ml-0.5"
            >
              System Prompt
            </Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              value={prompt}
              className="min-h-[250px]"
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="input-text"
              className="text-muted-foreground text-sm font-normal ml-0.5"
            >
              User Input
            </Label>
            <Textarea
              id="input-text"
              placeholder="I want to know about..."
              className="min-h-[150px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <AnimatePresence>
              {(modelChanged || promptChanged) && (
                <SyncChangesToWorkflow
                  workflowId={workflowId}
                  modelId={model?.id ?? ""}
                  prompt={prompt}
                  enabled={modelChanged || promptChanged}
                  onSuccess={handleSyncSuccess}
                />
              )}
            </AnimatePresence>
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isPending}
              className="w-full active:scale-[0.99]"
              size="sm"
              variant="primary"
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  Send
                  <Play className="size-2.5" fill="currentColor" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col gap-6 col-span-2">
        <DetailsCard metadata={metadata} />
        <ResponseCard
          output={output}
          model={model ?? models[0]!}
          isLoading={isPending}
          streamStatus={streamStatus}
        />
      </div>
    </Card>
  );
}
