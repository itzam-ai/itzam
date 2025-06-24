import { Contexts } from "@itzam/server/db/contexts/actions";
import { formatDistanceToNow } from "date-fns";
import { Group } from "lucide-react";
import { DeleteContextButton } from "./delete-context-button";
import Link from "next/link";

export const ContextItem = ({ context }: { context: Contexts[number] }) => {
  return (
    <div className="flex justify-between items-center">
      <Link
        href={`/dashboard/workflows/${context.workflowId}/contexts/${context.id}`}
        className="flex gap-2 items-center hover:opacity-80 transition-opacity cursor-pointer"
      >
        <div className="flex justify-center items-center rounded-md bg-card p-2 border border-border">
          <Group className="size-3" />
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-xs font-medium truncate max-w-40">
            {context.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(context.createdAt, { addSuffix: true })}
          </p>
        </div>
      </Link>
      <div className="flex gap-2 items-center z-10">
        <DeleteContextButton contextId={context.id} />
      </div>
    </div>
  );
};
