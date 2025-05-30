import { AttachmentWithUrl } from "./ai/types";

export type PreRunDetails = {
  id: string;
  origin: "SDK" | "WEB";
  input: string;
  prompt: string;
  threadId: string | null;
  modelId: string;
  workflowId: string;
  resourceIds: string[];
  attachments: AttachmentWithUrl[];
};
