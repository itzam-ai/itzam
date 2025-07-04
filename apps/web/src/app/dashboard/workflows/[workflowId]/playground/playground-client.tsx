"use client";

import type { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckIcon,
  FileIcon,
  GlobeIcon,
  PlusIcon,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ChangeModel from "~/components/playground/change-model";
import { DetailsCard } from "~/components/playground/details-card";
import { ModeToggle } from "~/components/playground/mode-toggle";
import { ResponseCard } from "~/components/playground/response-card";
import { SyncChangesToWorkflow } from "~/components/playground/sync-changes-to-workflow";
import {
  ThreadMessages,
  type Message,
} from "~/components/playground/thread-messages";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useThread } from "~/hooks/use-thread";
import { useKeyboardShortcut } from "~/lib/shortcut";
import { cn } from "~/lib/utils";
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
  const [contexts, setContexts] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>(workflow?.prompt || "");
  const [model, setModel] = useState<ModelWithCostAndProvider | null>(
    workflow?.model || null
  );
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null);

  // Thread mode states
  const [mode, setMode] = useState<"single" | "thread">("single");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>("");

  // Use thread hook
  const { threadId, setThreadId, createThread } = useThread({
    workflowSlug: workflow.slug,
    contextSlugs: contexts,
  });

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

  console.log(workflow);

  const handleModeChange = useCallback(
    (newMode: "single" | "thread") => {
      setMode(newMode);
      if (newMode === "single") {
        // Reset to single mode
        setThreadId(null);
        setMessages([]);
        setStreamingContent("");
      }
    },
    [setThreadId]
  );

  const handleNewThread = useCallback(async () => {
    setThreadId(null);
    setMessages([]);
    setStreamingContent("");
    setOutput("");
    setMetadata(null);
    // Create a new thread immediately
    const newThreadId = await createThread(`playground_${uuidv4().slice(0, 8)}`);
    if (!newThreadId) {
      console.error("Failed to create new thread");
    }
  }, [setThreadId, createThread]);

  const handleSubmit = async () => {
    if (!selectedWorkflow || !input.trim()) {
      return;
    }

    setIsPending(true);
    setStreamStatus(null);

    let currentThreadId = threadId;

    if (mode === "single") {
      setOutput("");
      setMetadata(null);
    } else {
      // Create thread if it doesn't exist
      if (!currentThreadId) {
        currentThreadId = await createThread(`playground_${uuidv4().slice(0, 8)}`);
        if (!currentThreadId) {
          setIsPending(false);
          return;
        }
      }

      // Add user message to thread
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent("");
    }

    try {
      const response = await fetch("/api/playground", {
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
          contextSlugs: contexts,
          threadId: mode === "thread" ? currentThreadId : null,
        }),
      });

      if (!response.ok) {
        console.error("Failed to generate content", response);
        throw new Error("Failed to generate content");
      }

      setStreamStatus("loading");
      setStreamStatus("streaming");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

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

        // error handling
        const errorMatch = text.match(/<!-- ERROR: (.*?) -->/);

        if (errorMatch && errorMatch[1]) {
          console.error("Error during streaming:", errorMatch[1]);
          setStreamStatus("error");
          if (mode === "single") {
            setOutput(errorMatch[1]);
          }
          setIsPending(false);
          return;
        }

        // Filter out metadata comments and only append actual text content
        const cleanText = text.replace(/\n\n<!-- METADATA:.*?-->/g, "");
        if (cleanText) {
          fullContent += cleanText;
          if (mode === "single") {
            setOutput((prev) => prev + cleanText);
          } else {
            setStreamingContent((prev) => prev + cleanText);
          }
        }
      }

      setIsPending(false);
      setStreamStatus("completed");

      // In thread mode, add the assistant message once streaming is complete
      if (mode === "thread" && fullContent) {
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
          model: model || undefined,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
        setInput(""); // Clear input for next message
      }
    } catch (error) {
      console.error("Error generating content:", error);
      if (mode === "single") {
        setOutput("");
      } else {
        setStreamingContent("");
      }
      setIsPending(false);
      setStreamStatus("error");
    }
  };

  useKeyboardShortcut("Enter", false, true, false, () => {
    if (!input.trim() || isPending || streamStatus === "streaming") {
      return;
    }

    handleSubmit();
  });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Playground</h2>
        <div className="flex items-center gap-2">
          {mode === "thread" && threadId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewThread}
              className="gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              New Thread
            </Button>
          )}
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>
      </div>

      <motion.div
        layout
        className={cn(
          "grid gap-8",
          mode === "single" ? "grid-cols-3" : "grid-cols-2"
        )}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
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
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <ModelIcon tag={model?.tag ?? ""} size="xs" />
                    <p className="font-medium text-sm">{model?.name ?? ""}</p>
                  </div>
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
                className="min-h-[200px]"
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="contexts"
                className="text-muted-foreground text-sm font-normal ml-0.5"
              >
                Contexts
              </Label>
              <div className="flex flex-col gap-2">
                {workflow.contexts.map((context) => {
                  return (
                    <div
                      key={context.id}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer text-sm font-normal text-muted-foreground p-3 rounded-md hover:bg-muted/30 transition-all border border-border opacity-50",
                        contexts.includes(context.slug) &&
                          "text-primary font-medium opacity-100"
                      )}
                      onClick={() => {
                        setContexts(
                          contexts.includes(context.slug)
                            ? contexts.filter((c) => c !== context.slug)
                            : [...contexts, context.slug]
                        );
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <Label
                            htmlFor={context.slug}
                            className="text-xs font-medium"
                          >
                            {context.name}
                          </Label>
                          {contexts.includes(context.slug) && (
                            <CheckIcon
                              className={cn(
                                "size-3",
                                contexts.includes(context.slug)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {context.resources.map((r) => (
                            <div key={r.id} className="flex items-center gap-1">
                              {r.type === "FILE" ? (
                                <FileIcon className="size-2.5" />
                              ) : (
                                <GlobeIcon className="size-2.5" />
                              )}
                              <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {r.title}
                              </p>
                            </div>
                          ))}
                          {context.resources.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No resources
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {workflow.contexts.length === 0 && (
                  <Link
                    href={`/dashboard/workflows/${workflowId}/knowledge/contexts`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                    >
                      <PlusIcon className="w-4 h-4 -mr-1" />
                      Create
                    </Button>
                  </Link>
                )}
              </div>
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
                disabled={
                  !input.trim() || isPending || streamStatus === "streaming"
                }
                className="w-full active:scale-[0.99] relative"
                size="sm"
                variant="primary"
              >
                <div className="flex items-center gap-1.5">
                  Send
                  <div className="absolute top-1/2 -translate-y-1/2 right-1.5 flex items-center gap-1">
                    <span
                      style={{
                        fontSize: "10px",
                      }}
                      className="text-muted font-mono bg-muted/20 rounded-sm px-1 border border-border/20 dark:text-foreground"
                    >
                      ⌘
                    </span>
                    <span
                      style={{
                        fontSize: "8px",
                      }}
                      className="text-muted font-mono bg-muted/20 rounded-sm px-1 border border-border/20 dark:text-foreground"
                    >
                      Enter
                    </span>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex h-full flex-col gap-6",
            mode === "single" ? "col-span-2" : ""
          )}
        >
          {mode === "single" ? (
            <>
              <DetailsCard metadata={metadata} />
              <ResponseCard
                output={output}
                model={model ?? models[0]!}
                isLoading={isPending}
                streamStatus={streamStatus}
              />
            </>
          ) : (
            <motion.div
              layout
              className="flex flex-col h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col h-full gap-4">
                <Card className="flex-1 overflow-hidden">
                  <div className="flex flex-col h-full">
                    <ThreadMessages
                      messages={messages}
                      currentModel={model}
                      isLoading={isPending}
                      streamingContent={streamingContent}
                    />
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </Card>
  );
}
