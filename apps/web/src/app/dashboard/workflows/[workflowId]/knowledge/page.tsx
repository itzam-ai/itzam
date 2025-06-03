import {
  getKnowledgeByWorkflowId,
  getMaxLimit,
} from "@itzam/server/db/knowledge/actions";
import { getContexts } from "@itzam/server/actions/contexts";
import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";
import { formatBytes } from "bytes-formatter";
import { FileInput } from "~/components/knowledge/file-input";
import { LinkInput } from "~/components/knowledge/link-input";
import { Usage } from "~/components/knowledge/usage";
import { Card } from "~/components/ui/card";
import { CreateContextDialog } from "~/components/contexts/create-context-dialog";
import { ContextSummaryCard } from "~/components/contexts/context-summary-card";
import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const knowledge = await getKnowledgeByWorkflowId(workflowId);
  const workflow = await getWorkflowByIdWithRelations(workflowId);

  const availableStorage = await getMaxLimit();

  const totalSize = knowledge?.resources.reduce(
    (acc, resource) => acc + (resource.fileSize ?? 0),
    0
  );

  const percentage = totalSize ? Math.min(totalSize / availableStorage, 1) : 0;

  if (!knowledge || "error" in knowledge) {
    return <div>Error: {JSON.stringify(knowledge?.error)}</div>;
  }

  if (!workflow || "error" in workflow) {
    return <div>Error loading workflow</div>;
  }

  return (
    <div className="space-y-8">
      {/* Knowledge Section */}
      <Card className="p-6 flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1 className="text font-medium">Knowledge</h1>
            <p className="text-xs text-muted-foreground mb-8">
              Add files and links to the model&apos;s knowledge base.
            </p>
          </div>
          <div className="flex gap-2.5 items-center">
            <Usage percentage={percentage} />
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">
                {formatBytes(totalSize ?? 0)}
              </span>{" "}
              / {formatBytes(availableStorage)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <FileInput 
            workflowId={workflowId} 
            knowledge={knowledge} 
            contexts={workflow.contexts || []} 
          />
          <LinkInput 
            workflowId={workflowId} 
            knowledge={knowledge} 
            contexts={workflow.contexts || []} 
          />
        </div>
      </Card>

      {/* Contexts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Contexts</h2>
            <p className="text-sm text-muted-foreground">
              Organize resources into contexts for dynamic inclusion in runs
            </p>
          </div>
          <CreateContextDialog 
            workflowId={workflowId}
            trigger={
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Context
              </Button>
            }
          />
        </div>
        
        {workflow.contexts && workflow.contexts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflow.contexts.map((context: any) => (
              <ContextSummaryCard
                key={context.id}
                context={context}
                workflowId={workflowId}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No contexts created yet
              </p>
              <CreateContextDialog 
                workflowId={workflowId}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create your first context
                  </Button>
                }
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
