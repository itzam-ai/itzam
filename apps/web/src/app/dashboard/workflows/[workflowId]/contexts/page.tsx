import { getContextsByWorkflowId } from "@itzam/server/db/contexts/actions";
import { getMaxLimit } from "@itzam/server/db/knowledge/actions";
import Link from "next/link";
import { Usage } from "~/components/knowledge/usage";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";

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
      <div className="flex flex-col gap-4">
        {contexts.map((context) => (
          <Link
            key={context.id}
            href={`/dashboard/workflows/${context.workflowId}/contexts/${context.id}`}
          >
            <Card>
              <CardHeader>
                <CardTitle>{context.name}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </Card>
  );
}
