"use client";

import { getCustomerSubscriptionStatus } from "@itzam/server/db/billing/actions";
import {
  getUsageChartData,
  UsageChartData,
} from "@itzam/server/db/usage/actions";
import { UserWorkflow } from "@itzam/server/db/workflow/actions";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { UsageChart } from "./usage-chart";

export function UsageChartWrapper({
  workflows,
}: {
  workflows: UserWorkflow[];
}) {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [data, setData] = useState<UsageChartData | null>(null);
  const [plan, setPlan] = useState<"hobby" | "basic" | "pro" | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getUsageChartData(workflowId);
      const { plan } = await getCustomerSubscriptionStatus();
      setData(data);
      setPlan(plan);
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
      plan={plan}
      workflows={workflows}
      workflowId={workflowId}
      setWorkflowId={setWorkflowId}
    />
  );
}
