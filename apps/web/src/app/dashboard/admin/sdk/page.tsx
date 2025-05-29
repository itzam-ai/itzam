"use client";

import { GetRunByIdResponseSchema } from "@itzam/hono/client/schemas";
import { env } from "@itzam/utils";
import Itzam from "itzam";
import { ItzamError } from "itzam/errors";
import ModelIcon from "public/models/svgs/model-icon";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";
import { ResponseCard } from "~/components/playground/response-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

const abdulLocalKey =
  "itzam_61b01ef4-bbaf-47ac-a1e2-580c33921e83_czzo14zxl7smr9y4ahqunreqy7hh52z";

const gustavoLocalKey =
  "itzam_1346408f-2401-4fea-8545-bd816776fbc4_xamqeu207qpk54xvf6btp1s6sajtfn57";

const slug = "code-assistant";

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
        setResponse(chunk);
      }

      const metadata = await response.metadata;
      setMetadata(metadata);

      handleGetRunById({ runId: metadata?.runId });

      setStreamStatus("completed");
      setIsLoading(false);
    } catch {
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
    } catch {
      toast.error("Error generating object");
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
    } catch {
      toast.error("Error streaming object");
      setIsLoading(false);
    }
  }

  async function handleGetRunById({ runId }: { runId: string }) {
    setTimeout(async () => {
      const response = await itzam.getRunById(runId);
      setRunById(response);
    }, 1000);
  }

  async function handleGetModels() {
    try {
      const models = await itzam.getModels();
      setModels(
        models.models.map((model) => ({ name: model.name, tag: model.tag }))
      );
    } catch (error) {
      toast.error("Error fetching models");
      if (error instanceof ItzamError) {
        console.error(error.message + " " + error.code);
      }
    }
  }

  useEffect(() => {
    handleGetModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <ModelIcon size="xs" tag={model.tag} />
              <p className="font-semibold text-sm">{model.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
