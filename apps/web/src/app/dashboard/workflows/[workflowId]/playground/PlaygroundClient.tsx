"use client";

import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { Loader2, Play } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useState } from "react";
import type { Workflow } from "~/lib/workflows";
import ChangeModel from "~/components/playground/change-model";
import { DetailsCard } from "~/components/playground/details-card";
import { ResponseCard } from "~/components/playground/response-card";
import { SyncChangesToWorkflow } from "~/components/playground/sync-changes-to-workflow";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";

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
  const [streamingMode, setStreamingMode] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [prompt, setPrompt] = useState<string>(workflow?.prompt || "");
  const [model, setModel] = useState<ModelWithCostAndProvider | null>(
    workflow?.model || null
  );
  const [runId, setRunId] = useState<string | null>(null);

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
    setRunId(null);

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
          streaming: streamingMode,
          workflowId: selectedWorkflow.id,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate content");
      }

      // Handle streaming response
      if (streamingMode) {
        setStreamStatus("loading");

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get stream reader");
        }

        setStreamStatus("streaming");

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            reader.releaseLock();
            setIsPending(false);
            setStreamStatus("completed");
            break;
          }

          // Decode and handle the chunk
          const text = new TextDecoder().decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              if (data.type === "object") {
                const delta = data.object["text"] ?? "";
                setOutput((prev) => prev + delta);
              }

              if (data.type === "finish") {
                setRunId(data.runId);
              }
            }
          }
        }
      } else {
        // Handle regular response
        const result = await response.json();
        setOutput(result.output);
        setRunId(result.runId);
        setIsPending(false);
      }
    } catch (error) {
      console.error("Error generating content:", error);
      setOutput("");
      setIsPending(false);
      setStreamStatus("error");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex h-full flex-col gap-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="relative flex items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                Workflow
                {(modelChanged || promptChanged) && (
                  <span className="size-1.5 animate-pulse rounded-full bg-yellow-500"></span>
                )}
              </CardTitle>
              <div className="absolute top-0 right-0">
                <SyncChangesToWorkflow
                  workflowId={workflowId}
                  modelId={model?.id ?? ""}
                  prompt={prompt}
                  enabled={modelChanged || promptChanged}
                  onSuccess={handleSyncSuccess}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="model"
                  className="flex items-center font-normal text-muted-foreground text-sm"
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
                    <ModelIcon tag={model?.tag ?? ""} size="sm" />
                    <p className="font-medium text-sm">{model?.name ?? ""}</p>
                    <ChangeModel models={models} setModel={setModel} />
                  </div>
                )}
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
                  className="min-h-[200px]"
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                  className="min-h-[100px]"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="streaming-mode">Stream response</Label>
              <Switch
                id="streaming-mode"
                checked={streamingMode}
                onCheckedChange={setStreamingMode}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isPending}
              className="w-full"
              size="sm"
              variant="primary"
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  Generate
                  <Play className="size-3" fill="currentColor" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="flex h-full flex-col gap-4">
        <DetailsCard runId={runId} isLoading={isPending} />
        <ResponseCard
          output={output}
          isLoading={isPending}
          streamStatus={streamStatus}
        />
      </div>
    </div>
  );
}
