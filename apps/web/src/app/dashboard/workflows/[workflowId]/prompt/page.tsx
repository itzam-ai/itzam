import {
  getWorkflowWithModelSettings,
  WorkflowWithModelSettingsAndModelAndProvider,
} from "@itzam/server/db/model-settings/actions";
import { PromptSettings } from "~/components/prompt/prompt-settings";
import { getEnhancePromptUsage } from "@itzam/server/db/prompt/actions";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;

  const workflow = await getWorkflowWithModelSettings(workflowId);
  const usage = await getEnhancePromptUsage();

  if (!workflow || "error" in workflow) {
    return <div>Error: {JSON.stringify(workflow?.error)}</div>;
  }

  return (
    <PromptSettings
      workflow={workflow as WorkflowWithModelSettingsAndModelAndProvider}
      usage={usage}
    />
  );
}
