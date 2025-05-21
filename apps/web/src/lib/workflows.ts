import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";
import { cache } from "react";
import "server-only";

export type Workflow = Exclude<
  Awaited<ReturnType<typeof getWorkflowByIdWithRelations>>,
  { data: null }
>;

export const getWorkflow = cache(
  async (workflowId: string) => await getWorkflowByIdWithRelations(workflowId)
);
