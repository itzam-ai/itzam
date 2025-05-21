import { getKnowledgeByWorkflowId } from "@itzam/server/db/knowledge/actions";
import { FileInput } from "~/components/knowledge/file-input";
import { LinkInput } from "~/components/knowledge/link-input";
import { Card } from "~/components/ui/card";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const knowledge = await getKnowledgeByWorkflowId(workflowId);

  if (!knowledge || "error" in knowledge) {
    return <div>Error: {JSON.stringify(knowledge?.error)}</div>;
  }

  return (
    <Card className="p-6 flex flex-col">
      <h1 className="text font-medium">Knowledge</h1>
      <p className="text-xs text-muted-foreground mb-8">
        Add files and links to he model&apos;s knowledge base.
      </p>
      <div className="flex flex-col gap-4">
        <FileInput workflowId={workflowId} knowledge={knowledge} />
        <LinkInput workflowId={workflowId} knowledge={knowledge} />
      </div>
    </Card>
  );
}
