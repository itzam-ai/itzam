import { getContextById } from "@itzam/server/db/contexts/actions";
import { getMaxLimit } from "@itzam/server/db/knowledge/actions";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { CopySlugButton } from "~/components/contexts/copy-slug-button";
import { FileInput } from "~/components/knowledge/file-input";
import { LinkInput } from "~/components/knowledge/link-input";
import { Usage } from "~/components/knowledge/usage";
import { Card } from "~/components/ui/card";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ workflowId: string; contextId: string }>;
}) {
  const { workflowId, contextId } = await params;

  const context = await getContextById(contextId);

  const availableStorage = await getMaxLimit();

  const totalSize = context?.resources.reduce(
    (acc, resource) => acc + (resource.fileSize ?? 0),
    0
  );

  return (
    <Card className="p-6 flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col">
          <Link href={`/dashboard/workflows/${workflowId}/contexts`}>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border-transparent transition-all">
              <ArrowLeftIcon className="size-3" />
              <span className="text-xs">Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-2 mt-4">
            <h1 className="text font-medium">{context.name}</h1>
            <CopySlugButton slug={context.slug} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {context.description}
          </p>
        </div>
        <Usage
          workflowId={workflowId}
          totalSize={totalSize ?? 0}
          availableStorage={availableStorage ?? 0}
        />
      </div>
      <div className="flex flex-col gap-4">
        <FileInput
          workflowId={workflowId}
          resources={context.resources}
          contextId={context.id}
        />
        <LinkInput
          workflowId={workflowId}
          resources={context.resources}
          contextId={context.id}
        />
      </div>
    </Card>
  );
}
