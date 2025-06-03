import { getContext } from "@itzam/server/actions/contexts";
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

        {/* Add Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Add Resources</CardTitle>
            <CardDescription>
              Add files and links to this context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileInput 
              workflowId={workflowId} 
              contextId={contextId}
              knowledge={null as any}
            />
            <LinkInput 
              workflowId={workflowId}
              contextId={contextId}
              knowledge={null as any}
            />
          </CardContent>
        </Card>

        {/* Resources List */}
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              Manage resources in this context
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resources.length > 0 ? (
              <div className="space-y-2">
                {resources.map((resource: any) => (
                  <KnowledgeItem
                    key={resource.id}
                    resource={resource}
                    workflowId={workflowId}
                    contextId={contextId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No resources added to this context yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    notFound();
  }
}