import { getContext } from "@itzam/server/actions/contexts";
import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { FileInput } from "~/components/knowledge/file-input";
import { LinkInput } from "~/components/knowledge/link-input";
import { KnowledgeItem } from "~/components/knowledge/knowledge-item";

export default async function ContextDetailPage({
  params,
}: {
  params: Promise<{ workflowId: string; contextId: string }>;
}) {
  const { workflowId, contextId } = await params;
  
  try {
    const contextResponse = await getContext(contextId);
    const context = contextResponse.data;
    
    if (!context) {
      notFound();
    }

    const workflow = await getWorkflowByIdWithRelations(workflowId);
    if (!workflow || "error" in workflow) {
      notFound();
    }

    const resources = context.resourceContexts?.map((rc: any) => rc.resource) || [];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/workflows/${workflowId}/knowledge`}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">{context.name}</h1>
              {context.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {context.description}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline">
            {resources.length} {resources.length === 1 ? "resource" : "resources"}
          </Badge>
        </div>

        {/* Resources */}
        <Card className="p-6 flex flex-col">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h1 className="text font-medium">Resources</h1>
              <p className="text-xs text-muted-foreground mb-8">
                Add files and links to this context.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <FileInput 
              workflowId={workflowId} 
              contextId={contextId}
              knowledge={{ resources } as any}
              contexts={workflow.contexts || []}
            />
            <LinkInput 
              workflowId={workflowId}
              contextId={contextId}
              knowledge={{ resources } as any}
              contexts={workflow.contexts || []}
            />
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    notFound();
  }
}