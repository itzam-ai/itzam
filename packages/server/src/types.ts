import { AttachmentWithUrl } from "./ai/types";

export type PreRunDetails = {
  id: string;
  origin: "API" | "WEB";
  input: string;
  prompt: string;
  threadId: string | null;
  modelId: string;
  workflowId: string;
  knowledgeId: string;
  resourceIds: string[];
  attachments: AttachmentWithUrl[];
  contextSlugs: string[];
};
