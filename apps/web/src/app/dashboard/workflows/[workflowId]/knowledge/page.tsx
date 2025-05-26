import {
  getKnowledgeByWorkflowId,
  getMaxLimit,
} from "@itzam/server/db/knowledge/actions";
import { formatBytes } from "bytes-formatter";
import { FileInput } from "~/components/knowledge/file-input";
import { LinkInput } from "~/components/knowledge/link-input";
import { Usage } from "~/components/knowledge/usage";
import { Card } from "~/components/ui/card";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const knowledge = await getKnowledgeByWorkflowId(workflowId);

  const availableStorage = await getMaxLimit();

  const totalSize = knowledge?.resources.reduce(
    (acc, resource) => acc + (resource.fileSize ?? 0),
    0
  );

  const percentage = totalSize ? Math.min(totalSize / availableStorage, 1) : 0;

  if (!knowledge || "error" in knowledge) {
    return <div>Error: {JSON.stringify(knowledge?.error)}</div>;
  }

  return (
    <Card className="p-6 flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text font-medium">Knowledge</h1>
          <p className="text-xs text-muted-foreground mb-8">
            Add files and links to the model&apos;s knowledge base.
          </p>
        </div>
        <div className="flex gap-2.5 items-center">
          <Usage percentage={percentage} />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">
              {formatBytes(totalSize ?? 0)}
            </span>{" "}
            / {formatBytes(availableStorage)}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <FileInput workflowId={workflowId} knowledge={knowledge} />
        <LinkInput workflowId={workflowId} knowledge={knowledge} />
      </div>
    </Card>
  );
}
