import { getKnowledgeByWorkflowId } from "@itzam/server/db/knowledge/actions";
import { FileInput } from "~/components/knowledge/file-input";
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
      <h1 className="text-lg font-medium">Knowledge</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Add files and links to he model&apos;s knowledge base.
      </p>
      <FileInput workflowId={workflowId} knowledge={knowledge} />
      {/* <LinkInput workflow={workflow} /> */}
    </Card>
  );
}
