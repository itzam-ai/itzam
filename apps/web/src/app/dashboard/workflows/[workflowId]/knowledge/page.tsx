import { getCustomerSubscriptionStatus } from "@itzam/server/db/billing/actions";
import {
  getKnowledgeByWorkflowId,
  getMaxLimit,
} from "@itzam/server/db/knowledge/actions";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { FileInput } from "~/components/knowledge/file-input";
import { LinkInput } from "~/components/knowledge/link-input";
import { Usage } from "~/components/knowledge/usage";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const knowledge = await getKnowledgeByWorkflowId(workflowId);

  const { plan } = await getCustomerSubscriptionStatus();

  const availableStorage = await getMaxLimit();

  const totalSize = knowledge?.resources.reduce(
    (acc, resource) => acc + (resource.fileSize ?? 0),
    0
  );

  if (!knowledge || "error" in knowledge) {
    return <div>Error: {JSON.stringify(knowledge?.error)}</div>;
  }

  return (
    <Card className="p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text font-medium">Knowledge</h1>
          <p className="text-xs text-muted-foreground">
            Add files and links to the model&apos;s knowledge base.
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Usage
            workflowId={workflowId}
            totalSize={totalSize ?? 0}
            availableStorage={availableStorage ?? 0}
          />
          <Link href={`/dashboard/workflows/${workflowId}/knowledge/contexts`}>
            <Button variant="ghost" size="sm">
              Contexts <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <FileInput
          workflowId={workflowId}
          resources={knowledge.resources}
          knowledgeId={knowledge.id}
          plan={plan}
        />
        <LinkInput
          workflowId={workflowId}
          resources={knowledge.resources}
          knowledgeId={knowledge.id}
          plan={plan}
        />
      </div>
    </Card>
  );
}
