"use client";

import { Contexts } from "@itzam/server/db/contexts/actions";
import { ContextItem } from "./context-item";
import { CreateContextButton } from "./create-context-button";

export const ContextsMenu = ({
  contexts,
  workflowId,
}: {
  contexts: Contexts;
  workflowId: string;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="font-medium ml-0.5">Contexts</h2>
        {contexts && contexts.length > 0 && (
          <CreateContextButton workflowId={workflowId} />
        )}
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-border shadow-sm bg-muted-foreground/5 p-2">
        {contexts.map((context) => (
          <ContextItem key={context.id} context={context} />
        ))}
      </div>
    </div>
  );
};
