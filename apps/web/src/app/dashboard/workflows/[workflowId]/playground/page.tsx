import { getAvailableModelsBasedOnUserKeys } from "@itzam/server/db/model/actions";
import PlaygroundClient from "~/app/dashboard/workflows/[workflowId]/playground/playground-client";
import { getWorkflow } from "~/lib/workflows";

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const workflow = await getWorkflow(workflowId);
  const models = await getAvailableModelsBasedOnUserKeys();

  if (!workflow || "error" in workflow) {
    return <div>Workflow not found</div>;
  }

  return (
    <PlaygroundClient
      workflow={workflow}
      models={models}
      workflowId={workflowId}
    />
  );
}
