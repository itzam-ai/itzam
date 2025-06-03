"use client";

import { addResourceToContexts } from "@itzam/server/actions/contexts";
import { Loader2, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { CreateContextDialog } from "./create-context-dialog";

interface ContextPopoverProps {
  resourceId: string;
  workflowId: string;
  contexts: Array<{
    id: string;
    name: string;
    slug: string;
    resourceContexts?: Array<{
      resourceId: string;
    }>;
  }>;
  trigger?: React.ReactNode;
}

export function ContextPopover({
  resourceId,
  workflowId,
  contexts,
  trigger,
}: ContextPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Track which contexts have this resource
  const [contextStates, setContextStates] = useState<Record<string, boolean>>(
    contexts.reduce((acc, context) => {
      acc[context.id] = context.resourceContexts?.some(
        (rc) => rc.resourceId === resourceId
      ) || false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const selectedContextIds = Object.entries(contextStates)
        .filter(([_, isSelected]) => isSelected)
        .map(([contextId]) => contextId);
      
      await addResourceToContexts(resourceId, selectedContextIds, workflowId);
      toast.success("Context associations updated");
      setOpen(false);
    } catch (error) {
      console.error("Error updating contexts:", error);
      toast.error("Failed to update contexts");
    } finally {
      setIsSyncing(false);
    }
  };

  const hasChanges = () => {
    return contexts.some((context) => {
      const currentState = contextStates[context.id] || false;
      const originalState = context.resourceContexts?.some(
        (rc) => rc.resourceId === resourceId
      ) || false;
      return currentState !== originalState;
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || <Button variant="ghost" size="sm">Add to Context</Button>}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium leading-none">Manage Contexts</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Select which contexts should include this resource
            </p>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {contexts.length > 0 ? (
              contexts.map((context) => (
                <div key={context.id} className="flex items-center justify-between">
                  <Label
                    htmlFor={`context-${context.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {context.name}
                  </Label>
                  <Switch
                    id={`context-${context.id}`}
                    checked={contextStates[context.id] || false}
                    onCheckedChange={(checked) => {
                      setContextStates((prev) => ({
                        ...prev,
                        [context.id]: checked,
                      }));
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contexts available
              </p>
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between gap-2">
            <CreateContextDialog
              workflowId={workflowId}
              trigger={
                <Button variant="outline" size="sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Context
                </Button>
              }
            />
            <Button
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || !hasChanges()}
            >
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sync
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}