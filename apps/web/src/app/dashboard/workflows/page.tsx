import { getAvailableModelsBasedOnUserKeys } from "@itzam/server/db/model/actions";
import { getUserWorkflows } from "@itzam/server/db/workflow/actions";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import "server-only";
import { WorkflowsEmptyState } from "~/components/empty-state/workflow-steps";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { CreateWorkflowDialog } from "~/components/workflows/create-workflow-dialog";
import { getCustomerSubscriptionStatus } from "@itzam/server/db/billing/actions";

export default async function WorkflowsPage() {
  const workflows = await getUserWorkflows();
  const models = await getAvailableModelsBasedOnUserKeys();

  const { plan } = await getCustomerSubscriptionStatus();

  const maxWorkflows = plan === "pro" ? 9999999 : plan === "basic" ? 10 : 2;

  const userHasReachedMaxWorkflows =
    workflows.data && workflows.data.length >= maxWorkflows;

  const userHasNoModelAvailable = models.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-xl">Workflows</h1>
          <p className="text-muted-foreground text-sm">
            Manage your AI workflows.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {userHasNoModelAvailable && (
            <Link href="/dashboard/providers">
              <Button size="sm" variant="secondary">
                Add Provider Key
              </Button>
            </Link>
          )}
          <CreateWorkflowDialog models={models}>
            <Button
              size="sm"
              variant="primary"
              disabled={userHasNoModelAvailable}
            >
              <Plus className="size-3" strokeWidth={2.5} />
              New Workflow
            </Button>
          </CreateWorkflowDialog>
        </div>
      </div>

      {userHasReachedMaxWorkflows && (
        <div className="flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
          <p className="text-sm flex items-center gap-2">
            You have reached the maximum number of workflows.
            <Link href="/dashboard/settings">
              <Button size="xs" variant="primary">
                Upgrade
              </Button>
            </Link>
          </p>
        </div>
      )}

      {workflows.error || workflows.data.length === 0 ? (
        <WorkflowsEmptyState
          userHasNoModelAvailable={userHasNoModelAvailable}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflows.data.map((workflow) => (
            <Link
              href={`/dashboard/workflows/${workflow.id}`}
              key={workflow.id}
              prefetch={true}
            >
              <Card className="flex h-full flex-col transition-all duration-300 hover:cursor-pointer hover:border-orange-600/80">
                <CardHeader>
                  <CardTitle>{workflow.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {workflow.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex flex-col gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Last run:
                      <span className="ml-1 text-foreground">
                        {workflow.runs[0]?.createdAt
                          ? formatDistanceToNow(
                              new Date(workflow.runs[0].createdAt),
                              { addSuffix: true }
                            )
                          : "Never"}
                      </span>
                    </span>

                    <span className="flex items-center text-muted-foreground gap-1">
                      Model:
                      <ModelIcon tag={workflow.model.tag} size="xs" />
                      <span className="text-foreground">
                        {workflow.model.name}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
