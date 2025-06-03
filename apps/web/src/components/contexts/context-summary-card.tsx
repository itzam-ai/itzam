"use client";

import { FileIcon, FileTextIcon, ImageIcon, LinkIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface ContextSummaryCardProps {
  context: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    resourceContexts?: Array<{
      resource: {
        id: string;
        type: "TEXT" | "IMAGE" | "FILE" | "URL";
        name?: string | null;
      };
    }>;
  };
  workflowId: string;
}

export function ContextSummaryCard({ context, workflowId }: ContextSummaryCardProps) {
  const resourceCount = context.resourceContexts?.length || 0;
  
  const getResourceCounts = () => {
    const counts = {
      TEXT: 0,
      IMAGE: 0,
      FILE: 0,
      URL: 0,
    };
    
    context.resourceContexts?.forEach((rc) => {
      if (rc.resource.type in counts) {
        counts[rc.resource.type]++;
      }
    });
    
    return counts;
  };
  
  const counts = getResourceCounts();
  
  const getIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <FileTextIcon className="h-3 w-3" />;
      case "IMAGE":
        return <ImageIcon className="h-3 w-3" />;
      case "FILE":
        return <FileIcon className="h-3 w-3" />;
      case "URL":
        return <LinkIcon className="h-3 w-3" />;
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{context.name}</CardTitle>
            {context.description && (
              <CardDescription className="text-xs">
                {context.description}
              </CardDescription>
            )}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/workflows/${workflowId}/context/${context.id}`}>
              Manage
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs">
            {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
          </Badge>
          {Object.entries(counts).map(([type, count]) => 
            count > 0 && (
              <div key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
                {getIcon(type)}
                <span>{count}</span>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}