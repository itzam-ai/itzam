"use client";

import { Group } from "lucide-react";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { CreateContextButton } from "./create-context-button";

export const EmptyState = ({ workflowId }: { workflowId: string }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-lg border border-dashed border-border mt-2">
      <EmptyStateDetails
        title="No contexts found"
        description={`Create a context to get started`}
        icon={<Group className="size-4" />}
      />
      <CreateContextButton workflowId={workflowId} />
    </div>
  );
};
