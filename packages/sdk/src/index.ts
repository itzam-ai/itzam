import type { ZodType, ZodTypeDef } from "zod";
import { type JsonSchema7Type } from "zod-to-json-schema";

import type { AppType } from "@itzam/hono/client/index.d";
import { hc, type InferRequestType } from "hono/client";
import { generateObject } from "./methods/generateObject";
import { generateText } from "./methods/generateText";
import { getModels } from "./methods/getModels";
import { getRunById } from "./methods/getRunById";
import { streamObject } from "./methods/streamObject";
import { streamText } from "./methods/streamText";
export type { InferRequestType, InferResponseType } from "hono/client";
export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);

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

export type GenerateObjectRequest<T> = WithAttachments<
  Omit<
    InferRequestType<typeof client.api.v1.generate.object.$post>["json"],
    "schema"
  > & {
    schema: ZodType<T, ZodTypeDef, unknown> | JsonSchema7Type;
  }
>;

type JsonSchemaWithProperties = JsonSchema7Type & {
  properties?: Record<string, JsonSchema7Type>;
  type?: string;
  items?: JsonSchema7Type;
};

/**
 *
 * @class Itzam
 * @param {string} apiKey - The API key to use for authentication
 * @param {ConfigurationParameters} [configuration] - The configuration to use for the API, used for debugging, you probably don't need to use this
 */
class Itzam {
  private apiKey: string;

  constructor(apiKey: string, options?: { basePath?: string }) {
    this.apiKey = apiKey;
  }

  async generateText(
    generateTextRequest: InferRequestType<
      typeof client.api.v1.generate.text.$post
    >["json"]
  ) {
    return generateText(this.apiKey, generateTextRequest);
  }

  async generateObject<T>(request: GenerateObjectRequest<T>) {
    return generateObject<T>(this.apiKey, request);
  }
  async streamText(
    input: InferRequestType<typeof client.api.v1.stream.text.$post>["json"]
  ) {
    return streamText(this.apiKey, input);
  }

  async streamObject<T>(input: GenerateObjectRequest<T>) {
    return streamObject<T>(this.apiKey, input);
  }

  async getRunById(
    runId: InferRequestType<
      (typeof client.api.v1.runs)[":id"]["$get"]
    >["param"]["id"]
  ) {
    return getRunById(this.apiKey, runId);
  }

  async getModels() {
    return getModels(this.apiKey);
  }
}

export { Itzam, type ResponseMetadata as StreamMetadata, type StreamResponse };
export default Itzam;
