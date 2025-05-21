import { WorkflowHeader } from "~/components/workflows/header";
import { WorkflowTabs } from "~/components/workflows/tabs";
import { getWorkflow } from "~/lib/workflows";

export default async function WorkflowLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;

  const workflow = await getWorkflow(workflowId);

  if (!workflow || "error" in workflow) {
    return <div>Workflow not found</div>;
  }

  return (
    <div>
      <WorkflowHeader
        name={workflow?.name ?? ""}
        description={workflow?.description ?? ""}
        workflowId={workflowId}
        slug={workflow?.slug ?? ""}
      />
      <WorkflowTabs id={workflowId} />
      {children}
    </div>
  );
}
