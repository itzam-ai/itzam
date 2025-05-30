"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import { UsagePeriodSelector } from "./usage-period-selector";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UserWorkflow } from "@itzam/server/db/workflow/actions";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";

interface DailyCost {
  date: string;
  cost: number;
  count: number;
}

export function UsageChart({
  initialData,
  isSubscribedToItzamPro,
  workflows,
  workflowId,
  setWorkflowId,
}: {
  initialData: DailyCost[];
  isSubscribedToItzamPro: boolean;
  workflows: UserWorkflow[];
  workflowId: string | null;
  setWorkflowId: (workflowId: string | null) => void;
}) {
  const theme = useTheme();
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [chartData, setChartData] = useState<DailyCost[]>([]);
  const costChartColor = "#0ea5e9"; // Blue
  const countChartColor = "#ea580c"; // Orange

  // Format data for display
  const formattedData = chartData.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date + "T00:00:00"), "MMM d"),
  }));

  const chartConfig = {
    cost: {
      label: "Cost ($)",
      color: costChartColor,
    },
    count: {
      label: "Runs",
      color: countChartColor,
    },
  };

  useEffect(() => {
    if (period === 7) {
      setChartData(initialData.slice(-7));
    } else if (period === 30) {
      setChartData(initialData.slice(-30));
    } else if (period === 90) {
      setChartData(initialData);
    }
  }, [period, initialData]);

  return (
    <div>
      <div className="flex justify-between pl-4 pb-4">
        <div className="flex items-center gap-3">
          <Select
            onValueChange={(value) => {
              setWorkflowId(value === "all" ? null : value);
            }}
            value={workflowId ?? "all"}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="All workflows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workflows</SelectItem>
              {workflows?.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AnimatePresence>
            {workflowId && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex gap-3 items-center"
              >
                <div className="flex gap-1">
                  <h4 className="text-sm text-muted-foreground">Cost:</h4>
                  <p className="text-sm font-medium">
                    <NumberFlow
                      value={formattedData.reduce(
                        (acc, item) => acc + item.cost,
                        0
                      )}
                      format={{
                        currency: "USD",
                        maximumFractionDigits: 6,
                      }}
                      prefix="$"
                    />
                  </p>
                </div>
                <div className="flex gap-1">
                  <h4 className="text-sm text-muted-foreground">Runs:</h4>
                  <p className="text-sm font-medium">
                    <NumberFlow
                      value={formattedData.reduce(
                        (acc, item) => acc + item.count,
                        0
                      )}
                    />
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <UsagePeriodSelector
          currentPeriod={period}
          onPeriodChange={(period) => setPeriod(period)}
          isSubscribedToItzamPro={isSubscribedToItzamPro}
        />
      </div>
      <div className="h-[300px] w-full">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={formattedData}
              margin={{ right: -24, bottom: 0, left: 0, top: 20 }}
            >
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={countChartColor}
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="100%"
                    stopColor={countChartColor}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme.resolvedTheme === "dark" ? "#262626" : "#e5e5e5"}
              />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                allowDecimals={true}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toString().slice(0, 4)}
                dx={-4}
                domain={[0, (dataMax: number) => dataMax * 1.1]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toString()}
                dx={8}
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="cost"
                name="cost"
                yAxisId="left"
                fill={costChartColor}
                radius={[4, 4, 0, 0]}
                barSize={period === 7 ? 24 : period === 30 ? 16 : 12}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="count"
                yAxisId="right"
                stroke={countChartColor}
                fillOpacity={1}
                fill="url(#colorCount)"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
