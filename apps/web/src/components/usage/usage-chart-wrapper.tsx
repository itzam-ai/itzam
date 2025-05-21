"use client";

import {
  getUsageChartData,
  UsageChartData,
} from "@itzam/server/db/usage/actions";
import { customerIsSubscribedToItzamPro } from "@itzam/server/db/billing/actions";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { UsageChart } from "./usage-chart";
import { UserWorkflow } from "@itzam/server/db/workflow/actions";

export function UsageChartWrapper({
  workflows,
}: {
  workflows: UserWorkflow[];
}) {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [data, setData] = useState<UsageChartData | null>(null);
  const [isSubscribedToItzamPro, setIsSubscribedToItzamPro] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getUsageChartData(workflowId);
      const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();
      setData(data);
      setIsSubscribedToItzamPro(isSubscribedToItzamPro.isSubscribed);
    };

    fetchData();
  }, [workflowId]);

  if (!data || "error" in data) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <UsageChart
      initialData={data}
      isSubscribedToItzamPro={isSubscribedToItzamPro}
      workflows={workflows}
      workflowId={workflowId}
      setWorkflowId={setWorkflowId}
    />
  );
}
