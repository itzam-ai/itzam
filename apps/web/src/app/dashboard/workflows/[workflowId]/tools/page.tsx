import { Card } from "~/components/ui/card";
import { WorkflowTools } from "~/components/workflows/workflow-tools";

export default async function WorkflowToolsPage() {
  return (
    <Card className="p-6">
      <WorkflowTools />
    </Card>
  );
}
