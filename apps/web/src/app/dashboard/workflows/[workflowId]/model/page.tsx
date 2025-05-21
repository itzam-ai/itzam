import {
  getWorkflowWithModelSettings,
  WorkflowWithModelSettingsAndModelAndProvider,
} from "@itzam/server/db/model-settings/actions";
import { getAvailableModelsWithCost } from "@itzam/server/db/model/actions";
import { getProviderKeys } from "@itzam/server/db/provider-keys/actions";
import { ModelPicker } from "~/components/model/model-picker";
import { ModelSettings } from "~/components/model/model-settings";
import { Card } from "~/components/ui/card";
export default async function ModelConfigPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;

  const workflow = await getWorkflowWithModelSettings(workflowId);
  const models = await getAvailableModelsWithCost();
  const providerKeys = await getProviderKeys();

  if (!workflow || "error" in workflow) {
    return <div>Error: {JSON.stringify(workflow?.error)}</div>;
  }

  return (
    <Card className="p-6">
      <ModelSettings
        workflow={workflow as WorkflowWithModelSettingsAndModelAndProvider}
      />

      <div className="mt-16">
        <ModelPicker
          models={models}
          currentModel={workflow.model}
          workflowId={workflowId}
          providerKeys={providerKeys}
        />
      </div>
    </Card>
  );
}
