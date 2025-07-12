"use client";

import { Wrench, Pencil } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function ToolsCard({
  enabledToolsCount = 0,
  workflowId,
}: {
  enabledToolsCount?: number;
  workflowId: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <p>Tools</p>
          <Wrench className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Wrench className="size-5" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm tracking-tight">
              Workflow Tools
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {enabledToolsCount > 0 ? (
                  <>
                    <Badge variant="gray" className="h-5 px-1.5 text-xs">
                      {enabledToolsCount}
                    </Badge>
                    <span className="ml-1">tools enabled</span>
                  </>
                ) : (
                  "No tools enabled"
                )}
              </span>
            </div>
          </div>
        </div>

        <Link href={`/dashboard/workflows/${workflowId}/tools`}>
          <Button size="icon" variant="outline">
            <Pencil className="size-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
