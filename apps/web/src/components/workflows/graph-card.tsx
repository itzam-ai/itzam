"use client";

import { getLast7DaysRunsCountByDay } from "@itzam/server/db/run/actions";
import { format } from "date-fns";
import { BarChart3, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

interface RunData {
  date: string;
  count: number;
}

const chartColor = "#ea580c";

export function GraphCard({ workflowId }: { workflowId: string }) {
  const theme = useTheme();
  const [data, setData] = useState<RunData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const runsData = await getLast7DaysRunsCountByDay(workflowId);

        setData(runsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching run data:", err);
        setError("Failed to load run data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workflowId]);

  // Format dates for display
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), "MMM dd"),
  }));

  const chartConfig = {
    runs: {
      label: "Runs",
      color: chartColor,
    },
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <p>Runs (Last 7 Days)</p>
          <BarChart3 className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full pl-0">
        {isLoading ? (
          <div className="flex h-[140px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-[140px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <EmptyStateDetails
              title="Failed to load run data"
              description="Please try again"
              icon={<BarChart3 className="size-4 text-muted-foreground/50" />}
              className="mt-12 pl-6"
            />
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                getLast7DaysRunsCountByDay(workflowId)
                  .then((data) => {
                    setData(data);
                    setError(null);
                  })
                  .catch((err) => {
                    console.error("Error fetching run data:", err);
                    setError("Failed to load run data");
                  })
                  .finally(() => {
                    setIsLoading(false);
                  });
              }}
              className="text-blue-500 text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[170px] w-full">
            <ResponsiveContainer>
              <AreaChart
                data={formattedData}
                margin={{ right: 10, bottom: 0, left: -10, top: 20 }}
              >
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={chartColor}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor={chartColor}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={
                    theme.resolvedTheme === "dark" ? "#262626" : "#e5e5e5"
                  }
                />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toString()}
                  dx={-8}
                  domain={[0, "dataMax + 10"]}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="runs"
                  stroke={chartColor}
                  fillOpacity={1}
                  fill="url(#colorRuns)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
