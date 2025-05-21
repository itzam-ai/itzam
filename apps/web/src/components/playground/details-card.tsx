import { ChartArea } from "lucide-react";
import EmptyStateDetails from "~/components/empty-state/empty-state-detais";
import { RunDetails } from "~/components/playground/run-details";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "../ui/skeleton";

export function DetailsCard({
  runId,
  isLoading,
}: {
  runId: string | null;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        {runId ? (
          <RunDetails runId={runId} />
        ) : isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : (
          <EmptyStateDetails
            title="No details to show"
            description="Run the workflow to see the response"
            icon={<ChartArea />}
            className="my-12"
          />
        )}
      </CardContent>
    </Card>
  );
}
