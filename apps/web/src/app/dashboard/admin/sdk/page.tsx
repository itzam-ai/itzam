"use client";

import { GetRunByIdResponseSchema } from "@itzam/hono/client/schemas";
import { env } from "@itzam/utils";
import Itzam, { ItzamAuthenticationError, ItzamError } from "itzam";
import { History, Plus } from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";
import { ResponseCard } from "~/components/playground/response-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

const abdulLocalKey =
  "itzam_5d695f4e-6ff7-460a-88aa-ec630e886da3_3edj5aoqedtq6u41y1z8jssa38vshdv8";

const gustavoLocalKey =
  "itzam_1346408f-2401-4fea-8545-bd816776fbc4_i5zgr14rwjru5z2lfv0x6roszruumlht";

const slug = "test-sdk";

type Metadata = {
  runId: string;
  cost: string;
  model: {
    name: string;
    tag: string;
  };
  inputTokens: number;
  outputTokens: number;
  durationInMs: number;
};

type GetRunByIdResponse = z.infer<typeof GetRunByIdResponseSchema>;

type Thread = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lookupKeys: string[];
};

type ThreadRun = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
  model: {
    name: string;
    tag: string;
  };
};
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

export default function AdminSdkPage() {
  const [apiKey, setApiKey] = useLocalStorage<"abdul" | "gustavo">(
    "whos_api_key",
    "abdul"
  );

  const itzam = useMemo(
    () =>
      new Itzam(apiKey === "abdul" ? abdulLocalKey : gustavoLocalKey, {
        basePath: env.NEXT_PUBLIC_APP_URL,
      }),
    [apiKey]
  );

  const [models, setModels] = useState<{ name: string; tag: string }[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [threadHistory, setThreadHistory] = useState<ThreadRun[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [input, setInput] = useState<string>("summarize the file");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [streamStatus, setStreamStatus] = useState<
    "loading" | "streaming" | "completed" | "error" | null
  >(null);
  const [runById, setRunById] = useState<GetRunByIdResponse | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const makeConfig = async () => ({
    workflowSlug: slug,
    input,
    threadId: selectedThreadId || undefined,
    attachments: file
      ? [
          {
            file: await toBase64(file),
          },
        ]
      : [],
  });

  const schema = z.object({
    name: z.string(),
    ageEstimate: z.number(),
    experiences: z.array(z.string()),
  });

  // Real API functions for thread management using new structure
  const fetchThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    try {
      const response = await itzam.threads.list(slug);
      console.log(response);
      setThreads(response.threads);
    } catch (error) {
      toast.error("Failed to fetch threads");
      console.error("Error fetching threads:", error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [itzam]);

  const createNewThread = async () => {
    try {
      const response = await itzam.threads.create({
        workflowSlug: slug,
      });

      // Add the new thread to the list
      setThreads((prev) => [response, ...prev]);
      setSelectedThreadId(response.id);
      toast.success(`Created new thread: ${response.name}`);
    } catch (error) {
      toast.error("Failed to create thread");
      console.error("Error creating thread:", error);
    }
  };

  const fetchThreadHistory = async (threadId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await itzam.threads.getRuns(threadId);
      setThreadHistory(response.runs);
    } catch (error) {
      toast.error("Failed to fetch thread history");
      console.error("Error fetching thread history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleViewHistory = async () => {
    if (!selectedThreadId) {
      toast.error("Please select a thread first");
      return;
    }
    await fetchThreadHistory(selectedThreadId);
    setIsHistoryModalOpen(true);
  };

  async function handleGenerateText() {
    setIsLoading(true);
    setResponse("");
    const config = await makeConfig();
    try {
      const response = await itzam.generateText(config);
      setResponse(response.text);
      setMetadata(response.metadata);

      handleGetRunById({ runId: response.metadata.runId });

      setIsLoading(false);
    } catch {
      toast.error("Error generating text");
      setIsLoading(false);
    }
  }

  async function handleStreamText() {
    try {
      setIsLoading(true);
      setResponse("");
      setStreamStatus("loading");
      const config = await makeConfig();
      const response = await itzam.streamText(config);
      setStreamStatus("streaming");

      for await (const chunk of response.stream) {
        setResponse((prev) => prev + chunk);
      }

      const metadata = await response.metadata;
      setMetadata(metadata);

      handleGetRunById({ runId: metadata?.runId });

      setStreamStatus("completed");
      setIsLoading(false);
    } catch (error) {
      toast.error("Error streaming text");
      setIsLoading(false);
    }
  }

  async function handleGenerateObject() {
    setIsLoading(true);
    const config = await makeConfig();
    try {
      const response = await itzam.generateObject({
        ...config,
        schema,
      });
      setResponse(JSON.stringify(response.object, null, 2));
      setIsLoading(false);
      handleGetRunById({ runId: response.metadata.runId });
      setMetadata(response.metadata);
    } catch (error: any) {
      toast.error("Error generating object");
      console.error(error);
      setIsLoading(false);
    }
  }

  async function handleStreamObject() {
    const config = await makeConfig();
    try {
      const response = await itzam.streamObject({
        ...config,
        schema,
      });

      for await (const chunk of response.stream) {
        setResponse(JSON.stringify(chunk, null, 2));
      }

      const metadata = await response.metadata;
      setMetadata(metadata);

      handleGetRunById({ runId: metadata?.runId });

      setStreamStatus("completed");
      setIsLoading(false);
    } catch (error) {
      toast.error("Error streaming object");
      console.error(error);
      setIsLoading(false);
    }
  }

  async function handleGetRunById({ runId }: { runId: string }) {
    setTimeout(async () => {
      const response = await itzam.getRunById(runId);
      setRunById(response);
    }, 1000);
  }

  const handleGetModels = useCallback(async () => {
    try {
      const models = await itzam.getModels();
      setModels(
        models.models.map((model) => ({ name: model.name, tag: model.tag }))
      );
    } catch (error) {
      toast.error("Error fetching models");
    }
  }, [itzam]);

  useEffect(() => {
    handleGetModels();
    fetchThreads();
  }, [handleGetModels, fetchThreads]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <h2 className="font-bold text-2xl">
          Input <span className="text-muted-foreground">({slug})</span>
        </h2>
        <Button
          className="ml-auto"
          variant="secondary"
          onClick={() => setApiKey(apiKey === "abdul" ? "gustavo" : "abdul")}
        >
          Using {apiKey === "abdul" ? "abdul" : "gustavo"}&apos;s api key
        </Button>
      </div>

      {/* Thread Selector */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="thread-select">Thread (optional)</Label>
          <Select value={selectedThreadId} onValueChange={setSelectedThreadId}>
            <SelectTrigger id="thread-select">
              <SelectValue
                placeholder={
                  isLoadingThreads
                    ? "Loading threads..."
                    : "Select a thread or create new"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {threads.map((thread) => (
                <SelectItem key={thread.id} value={thread.id}>
                  {thread.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={createNewThread}>
          <Plus className="h-4 w-4" />
        </Button>
        {selectedThreadId && (
          <Dialog
            open={isHistoryModalOpen}
            onOpenChange={setIsHistoryModalOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleViewHistory}>
                <History className="h-4 w-4" />
                View History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thread History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {isLoadingHistory ? (
                  <div>Loading history...</div>
                ) : threadHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages in this thread yet
                  </div>
                ) : (
                  threadHistory.map((run, index) => (
                    <div key={run.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="blue">Message {index + 1}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(run.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <strong>User:</strong> {run.input}
                        </div>
                        <div>
                          <strong>Assistant:</strong> {run.output}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Model: {run.model.name} ({run.model.tag})
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4">
        <Textarea
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            onClick={handleGenerateText}
            disabled={isLoading || !input}
          >
            Generate text
          </Button>

          <Button
            variant="secondary"
            onClick={handleGenerateObject}
            disabled={isLoading || !input}
          >
            Generate object
          </Button>

          <Button
            variant="primary"
            onClick={handleStreamText}
            disabled={isLoading || !input}
          >
            Stream text
          </Button>

          <Button
            variant="primary"
            onClick={handleStreamObject}
            disabled={isLoading || !input}
          >
            Stream object
          </Button>
          <Input
            className="col-span-2"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <div className="flex gap-8">
        <div className="w-2/3 min-h-[400px]">
          <ResponseCard
            model={null}
            output={response}
            streamStatus={streamStatus}
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-col gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">Metadata</p>
            <p>Run ID: {metadata?.runId ?? "-"}</p>
            <p>Cost: {metadata?.cost ?? "-"}</p>
            <p>
              Model: {metadata?.model?.name ?? "-"} (
              {metadata?.model?.tag ?? "-"})
            </p>
            <p>Duration: {metadata?.durationInMs ?? "-"}</p>
            <p>Input tokens: {metadata?.inputTokens ?? "-"}</p>
            <p>Output tokens: {metadata?.outputTokens ?? "-"}</p>
          </div>

          <div className="flex flex-col justify-start gap-2">
            <p className="font-semibold text-sm">Get Run By Id (1s delay)</p>
            <p>Cost: {runById?.cost ?? "-"}</p>
            <p>
              Model: {runById?.model?.name ?? "-"} ({runById?.model?.tag ?? "-"}
              )
            </p>
            <p>Duration: {runById?.durationInMs ?? "-"}</p>
            <p>Input tokens: {runById?.inputTokens ?? "-"}</p>
            <p>Output tokens: {runById?.outputTokens ?? "-"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-bold">Models</p>
        <div className="grid grid-cols-6 gap-2">
          {models.map((model) => (
            <div className="flex items-center gap-2" key={model.name}>
              <ModelIcon size="us" tag={model.tag} />
              <p className="font-normal text-xs">{model.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
