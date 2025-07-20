import type { JsonSchema } from "json-schema-to-zod";

export interface Metadata {
  cost: string;
  model: Model;
  runId: string;
  inputTokens: number;
  durationInMs: number;
  outputTokens: number;
  aiParams: AiParams;
}

export interface EventMetadata extends Metadata {
  type: "event";
  callback: {
    customProperties: Record<string, unknown>;
    headers: Record<string, string>;
    url: string;
  };
}

export interface AiParams {
  model: Model;
  output: string;
  schema?: JsonSchema;
  system: string;
  messages: Message[];
  attachments: any[];
}

export interface Model {
  tag: string;
  name: string;
}

export interface Message {
  role: string;
  content: Content[];
}

export interface Content {
  text: string;
  type: string;
}
