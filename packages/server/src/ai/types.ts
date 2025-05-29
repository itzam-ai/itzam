import { generateObject, jsonSchema, streamObject } from "ai";
import type { Model } from "../db/model/actions";
import { PreRunDetails } from "../types";

export type AiParams = StreamInput | GenerateInput;

type Base64File = string;
type UrlFile = string;

export type Attachment = {
  file: Base64File | UrlFile;
  mimeType?: string;
};

export type AttachmentWithUrl = Attachment & {
  url: string;
};

type CreateAiParamsInput = {
  userId: string;
  input?: string;
  attachments?: AttachmentWithUrl[];
  prompt: string;
  model: Model;
  schema?: ItzamRequestSchema | null;
  enum?: string[];
  run: PreRunDetails;
};

export type ItzamRequestSchema = Parameters<typeof jsonSchema>[0];
type StreamInput = Parameters<typeof streamObject>[0];
type GenerateInput = Parameters<typeof generateObject>[0];

export type CreateAiParamsFn = (
  input: CreateAiParamsInput
) => Promise<AiParams>;
