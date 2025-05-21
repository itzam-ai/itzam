import { getLast30RunsInTheLast30Days } from "@itzam/server/db/run/actions";
import { HowToIntegrate } from "~/components/empty-state/how-to-integrate";
import { LastRuns } from "~/components/runs/last-runs";
import { GraphCard } from "~/components/workflows/graph-card";
import { ModelCard } from "~/components/workflows/model-card";
import { PromptCard } from "~/components/workflows/prompt-card";
import { SlugCard } from "~/components/workflows/slug-card";
import { getWorkflow } from "~/lib/workflows";

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const workflow = await getWorkflow(workflowId);
  const runs = await getLast30RunsInTheLast30Days(workflowId);

  if ("error" in workflow) {
    return <div>{workflow.error.error.toString()}</div>;
  }

  return (
    <div className="container">
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <SlugCard workflowSlug={workflow?.slug ?? ""} />

          <ModelCard model={workflow?.model} workflowId={workflowId} />
        </div>
        <PromptCard
          initialPrompt={workflow?.prompt ?? ""}
          workflowId={workflowId}
        />
        <GraphCard workflowId={workflowId} />
      </div>

      {workflow.runs.length === 0 && (
        <div className="mb-8">
          <HowToIntegrate workflowSlug={workflow?.slug ?? ""} />
        </div>
      )}

      <LastRuns lastRuns={runs} workflowId={workflowId} />
    </div>
  );
}
