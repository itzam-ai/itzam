import type { ZodType, ZodTypeDef } from "zod";
import { type JsonSchema7Type } from "zod-to-json-schema";

import type { AppType } from "@itzam/hono/client/index.d";
import { hc, type InferRequestType } from "hono/client";
import { createThread } from "./methods/createThread";
import { generateObject } from "./methods/generateObject";
import { generateText } from "./methods/generateText";
import { getModels } from "./methods/getModels";
import { getRunById } from "./methods/getRunById";
import { getRunsByThread } from "./methods/getRunsByThread";
import { getThreadById } from "./methods/getThreadById";
import { getThreadsByWorkflow } from "./methods/getThreadsByWorkflow";
import { streamObject } from "./methods/streamObject";
import { streamText } from "./methods/streamText";
export type { InferRequestType, InferResponseType } from "hono/client";

// File attachment type
export type Attachment = {
  file: string | Blob | File;
  mimeType?: string;
};

// Extension of request types to include attachments
export type WithAttachments<T> = T & {
  attachments?: Attachment[];
};

type ResponseMetadata = {
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

type StreamResponse<T = string> = {
  stream: AsyncGenerator<T, void, unknown>;
  metadata: Promise<ResponseMetadata>;
};

// Create a temporary client for type inference
const tempClient = hc<AppType>("");

export type GenerateObjectRequest<T> = WithAttachments<
  Omit<
    InferRequestType<typeof tempClient.api.v1.generate.object.$post>["json"],
    "schema"
  > & {
    schema: ZodType<T, ZodTypeDef, unknown> | JsonSchema7Type;
  }
>;

/**
 *
 * @class Itzam
 * @param {string} apiKey - The API key to use for authentication
 * @param {object} [options] - Configuration options
 * @param {string} [options.basePath] - The base URL for the API (defaults to NEXT_PUBLIC_APP_URL environment variable)
 */
class Itzam {
  private apiKey: string;
  private client: ReturnType<typeof hc<AppType>>;

  constructor(apiKey: string, options?: { basePath?: string }) {
    this.apiKey = apiKey;
    const basePath = options?.basePath || process.env.NEXT_PUBLIC_APP_URL;
    if (!basePath) {
      throw new Error(
        "Base path must be provided either through options.basePath or NEXT_PUBLIC_APP_URL environment variable"
      );
    }
    this.client = hc<AppType>(basePath);
  }

  async generateText(
    generateTextRequest: InferRequestType<
      typeof tempClient.api.v1.generate.text.$post
    >["json"]
  ) {
    return generateText(this.client, this.apiKey, generateTextRequest);
  }

  async generateObject<T>(request: GenerateObjectRequest<T>) {
    return generateObject<T>(this.client, this.apiKey, request);
  }
  async streamText(
    input: InferRequestType<typeof tempClient.api.v1.stream.text.$post>["json"]
  ) {
    return streamText(this.client, this.apiKey, input);
  }

  async streamObject<T>(input: GenerateObjectRequest<T>) {
    return streamObject<T>(this.client, this.apiKey, input);
  }

  async getRunById(
    runId: InferRequestType<
      (typeof tempClient.api.v1.runs)[":id"]["$get"]
    >["param"]["id"]
  ) {
    return getRunById(this.client, this.apiKey, runId);
  }

  async getModels() {
    return getModels(this.client, this.apiKey);
  }

  // Threads namespace
  threads = {
    create: async (
      createThreadRequest: InferRequestType<
        typeof tempClient.api.v1.threads.$post
      >["json"]
    ) => {
      return createThread(this.client, this.apiKey, createThreadRequest);
    },

    list: async (workflowSlug: string, options?: { lookupKey?: string }) => {
      return getThreadsByWorkflow(
        this.client,
        this.apiKey,
        workflowSlug,
        options
      );
    },

    get: async (threadId: string) => {
      return getThreadById(this.client, this.apiKey, threadId);
    },

    getRuns: async (threadId: string) => {
      return getRunsByThread(this.client, this.apiKey, threadId);
    },
  };
}

export { Itzam, type ResponseMetadata as StreamMetadata, type StreamResponse };
export default Itzam;
