import { getCustomerSubscriptionStatus } from "@itzam/server/db/billing/actions";
import { getAvailableModelsWithCost } from "@itzam/server/db/model/actions";
import {
  getRunsByWorkflowId,
  getRunsCount,
} from "@itzam/server/db/run/actions";
import { Play } from "lucide-react";
import { SearchParams } from "nuqs/server";
import EmptyStateDetails from "~/components/empty-state/empty-state-detais";
import { ExpandableRunRow } from "~/components/runs/expandable-run-row";
import RunFilters from "~/components/runs/run-filters";
import RunPagination from "~/components/runs/run-pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export default async function RunsTable({
  params,
  searchParams,
}: {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { workflowId } = await params;
  const queryParams = await searchParams;

  const paramsFromQuery = {
    modelId:
      typeof queryParams.modelId === "string" ? queryParams.modelId : undefined,
    threadId:
      typeof queryParams.threadId === "string"
        ? queryParams.threadId
        : undefined,
    status:
      typeof queryParams.status === "string"
        ? (queryParams.status as "RUNNING" | "COMPLETED" | "FAILED")
        : undefined,
    startDate:
      typeof queryParams.startDate === "string"
        ? queryParams.startDate
        : undefined,
    endDate:
      typeof queryParams.endDate === "string" ? queryParams.endDate : undefined,
  };

  const runs = await getRunsByWorkflowId(
    workflowId,
    Number(queryParams.page) || 1,
    paramsFromQuery,
    queryParams.sort as string
  );

  const models = await getAvailableModelsWithCost();
  const { plan } = await getCustomerSubscriptionStatus();

  const totalRuns = await getRunsCount(workflowId, paramsFromQuery);

  const totalPages = Math.ceil(totalRuns / 50);

  return (
    <div className="space-y-4">
      <RunFilters models={models} plan={plan} />
      {runs.length === 0 ? (
        <div className="rounded-lg border">
          <EmptyStateDetails
            title="No runs found"
            description="There are no runs that match your filters"
            icon={<Play />}
            className="py-20"
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="rounded-l-lg pl-4">Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Input</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Duration (ms)</TableHead>
              <TableHead className="rounded-r-lg"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-background">
            {runs.map((run) => (
              <ExpandableRunRow key={run.id} run={run} />
            ))}
          </TableBody>
        </Table>
      )}

      {totalRuns > 0 && (
        <div className="flex justify-between px-2 pt-2">
          <div className="text-muted-foreground text-sm">
            Showing {runs.length} of {totalRuns} runs
          </div>
          <div className="flex items-center space-x-2">
            <RunPagination totalPages={totalPages} />
          </div>
        </div>
      )}
    </div>
  );
}
