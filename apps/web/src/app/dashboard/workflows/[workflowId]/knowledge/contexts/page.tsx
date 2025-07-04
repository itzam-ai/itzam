import { getContextsByWorkflowId } from "@itzam/server/db/contexts/actions";
import { getMaxLimit } from "@itzam/server/db/knowledge/actions";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { ContextsMenu } from "~/components/contexts/contexts";
import { EmptyState } from "~/components/contexts/empty-state";
import { Usage } from "~/components/knowledge/usage";
import { Card } from "~/components/ui/card";

export default async function ContextsPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const contexts = await getContextsByWorkflowId(workflowId);

  const availableStorage = await getMaxLimit();

  const totalSize = contexts.reduce(
    (acc, context) =>
      acc +
      (context.resources.reduce(
        (acc, resource) => acc + (resource.fileSize ?? 0),
        0
      ) ?? 0),
    0
  );

  if (!contexts || "error" in contexts) {
    return <div>Error: {JSON.stringify(contexts?.error)}</div>;
  }

  return (
    <Card className="p-6 flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <Link href={`/dashboard/workflows/${workflowId}/knowledge`}>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border-transparent transition-all mb-4">
              <ArrowLeftIcon className="size-3" />
              <span className="text-xs">Back</span>
            </button>
          </Link>
          <h1 className="text font-medium">Contexts</h1>
          <p className="text-xs text-muted-foreground mb-8">
            Create contexts (files and links) to use programatically.
          </p>
        </div>
        <Usage
          workflowId={workflowId}
          totalSize={totalSize ?? 0}
          availableStorage={availableStorage ?? 0}
        />
      </div>

      {contexts.length > 0 && (
        <ContextsMenu contexts={contexts} workflowId={workflowId} />
      )}

      {contexts.length === 0 && <EmptyState workflowId={workflowId} />}
    </Card>
  );
}
