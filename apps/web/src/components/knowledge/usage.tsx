"use client";

import {
  subscribeToUsageUpdates,
  UsageUpdatePayload,
} from "@itzam/supabase/client";
import NumberFlow from "@number-flow/react";
import { formatBytes } from "bytes-formatter";
import { useEffect, useState } from "react";
import { PolarGrid, RadialBar, RadialBarChart } from "recharts";
import { ChartConfig, ChartContainer } from "~/components/ui/chart";

const usageColor = "#ea580c";

const chartConfig = {
  usage: {
    label: "Usage",
  },
  safari: {
    label: "Usage",
    color: usageColor,
  },
} satisfies ChartConfig;

export function Usage({
  totalSize,
  availableStorage,
  workflowId,
}: {
  totalSize: number;
  availableStorage: number;
  workflowId: string;
}) {
  const [totalSizeUsed, setTotalSizeUsed] = useState(totalSize);

  const percentage = totalSizeUsed
    ? Math.min(totalSizeUsed / availableStorage, 1)
    : 0;

  const startAngle = 90;
  const endAngle = startAngle - (percentage < 0.065 ? 0.065 : percentage) * 360;

  const chartData = [
    {
      usage: percentage,
      fill: usageColor,
    },
  ];

  const channelId = `${workflowId}-usage`;

  useEffect(() => {
    const unsubscribe = subscribeToUsageUpdates(
      channelId,
      (payload: UsageUpdatePayload) => {
        setTotalSizeUsed((prev) => prev + payload.newFileSize);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [channelId]);

  return (
    <div className="flex gap-2.5 items-center">
      <div className="size-5">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <RadialBarChart
            data={chartData}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={8}
            outerRadius={12}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted/80 last:fill-background"
              polarRadius={[10, 6]}
            />
            <RadialBar dataKey="usage" background cornerRadius={6} />
          </RadialBarChart>
        </ChartContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="text-foreground whitespace-nowrap">
          <NumberFlow
            value={Number(formatBytes(totalSizeUsed).split(" ")[0])}
            className="text-foreground"
            style={{
              fontWeight: "700",
            }}
          />

          {" " + (formatBytes(totalSizeUsed).split(" ")[1] ?? "MB")}
        </span>{" "}
        / {formatBytes(availableStorage)}
      </p>
    </div>
  );
}
