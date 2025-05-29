import { RunWithModelAndResourcesAndAttachments } from "@itzam/server/db/run/actions";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ExpandableRunRow } from "./expandable-run-row";
export function LastRuns({
  lastRuns,
  workflowId,
}: {
  lastRuns: RunWithModelAndResourcesAndAttachments[] | undefined;
  workflowId: string;
}) {
  return (
    <>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-medium">Last Runs</h2>
        {lastRuns && lastRuns.length > 0 && (
          <Link
            href={`/dashboard/workflows/${workflowId}/runs`}
            prefetch={true}
          >
            <Button variant="outline" size="sm">
              See all <ArrowRight className="size-3" />
            </Button>
          </Link>
        )}
      </div>

      {!lastRuns?.length ? (
        <div className="rounded-lg border py-16">
          <EmptyStateDetails
            title="No recent runs"
            description="There are no runs for the last 30 days"
            icon={<Play />}
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
          <TableBody>
            {lastRuns.map((run) => (
              <ExpandableRunRow key={run.id} run={run} />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
