"use client";

import { Copy, IdCard } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function SlugCard({ workflowSlug }: { workflowSlug: string }) {
  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <p>Slug</p>
          <IdCard className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => {
            navigator.clipboard.writeText(workflowSlug);
            toast.success("Workflow slug copied!");
          }}
          className="group flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 hover:cursor-pointer hover:bg-accent"
        >
          <p className="truncate font-mono text-[12px]">{workflowSlug}</p>
          <Copy className="size-3 transition-all duration-200 group-hover:opacity-80" />
        </button>
      </CardContent>
    </Card>
  );
}
