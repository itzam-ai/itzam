export type PreRunDetails = {
  id: string;
  origin: "SDK" | "WEB";
  input: string;
  prompt: string;
  threadId: string | null;
  modelId: string;
  workflowId: string;
  resourceIds: string[];
};
