"use client";

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

export function Usage({ percentage }: { percentage: number }) {
  const startAngle = 90;
  const endAngle = startAngle - (percentage < 0.065 ? 0.065 : percentage) * 360;

  const chartData = [
    {
      usage: percentage,
      fill: usageColor,
    },
  ];

  return (
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
  );
}
