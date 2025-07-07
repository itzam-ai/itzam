"use client";

import {
  getCurrentMonthUsageInformation,
  UsageInformation,
} from "@itzam/server/db/usage/actions";
import {
  getUserWorkflows,
  UserWorkflow,
} from "@itzam/server/db/workflow/actions";
import NumberFlow from "@number-flow/react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  CircleDollarSign,
  Coins,
  Play,
} from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useEffect, useState } from "react";
import EmptyStateDetails from "~/components/empty-state/empty-state-detais";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { UsageChartWrapper } from "~/components/usage/usage-chart-wrapper";

export default function UsagePage() {
  const [workflows, setWorkflows] = useState<UserWorkflow[]>([]);
  const [usageData, setUsageData] = useState<UsageInformation | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      const usageData = await getCurrentMonthUsageInformation();
      setUsageData(usageData);
    };

    const fetchWorkflows = async () => {
      const workflows = await getUserWorkflows();
      if (workflows.data) {
        setWorkflows(workflows.data);
      }
    };

    fetchWorkflows();
    fetchUsageData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-1">
        <div>
          <h1 className="font-semibold text-xl">Usage</h1>
          <p className="text-muted-foreground text-sm">
            Manage your usage and track your costs.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <p>Runs</p>
              <Play className="size-4 text-muted-foreground/50" />
            </CardTitle>
            <CardDescription>Current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl">
              <NumberFlow value={usageData?.totalRequests ?? 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <p>Total Cost</p>
              <CircleDollarSign className="size-4 text-muted-foreground/50" />
            </CardTitle>
            <CardDescription>USD for current month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-3xl">
              <NumberFlow
                value={usageData?.totalCost ?? 0}
                format={{
                  currency: "USD",
                  maximumFractionDigits: 3,
                  minimumFractionDigits: 2,
                }}
                prefix="$"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <p>Tokens</p>
              <Coins className="size-4 text-muted-foreground/50" />
            </CardTitle>
            <CardDescription className="flex items-center">
              Input <ArrowDown className="mx-1 size-3" /> + Output{" "}
              <ArrowUp className="size-3 ml-1" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-2">
              <div className="mt-1 font-semibold text-3xl">
                <NumberFlow
                  value={
                    (usageData?.totalInputTokens ?? 0) +
                    (usageData?.totalOutputTokens ?? 0)
                  }
                />
              </div>
              <div className="flex flex-col items-end gap-1 text-muted-foreground text-xs">
                <span className="flex items-center gap-1">
                  <NumberFlow value={usageData?.totalInputTokens ?? 0} />{" "}
                  <ArrowDown className="size-3" />
                </span>
                <span className="flex items-center gap-1">
                  <NumberFlow value={usageData?.totalOutputTokens ?? 0} />{" "}
                  <ArrowUp className="size-3" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage x Cost Chart */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <p>Daily Cost Breakdown</p>
            <BarChart3 className="size-4 text-muted-foreground/50" />
          </CardTitle>
          <CardDescription>Runs and cost by day</CardDescription>
        </CardHeader>
        <CardContent className="pl-1.5">
          <UsageChartWrapper workflows={workflows} />
        </CardContent>
      </Card>

      {/* Provider and Model Usage */}
      <Card>
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center justify-between text-lg">
            <p>Providers</p>
            <Bot className="size-4 text-muted-foreground/50" />
          </CardTitle>
          <CardDescription>
            Cost breakdown by provider and model
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageData?.providerUsage && usageData.providerUsage.length > 0 ? (
            <div className="space-y-6">
              {usageData.providerUsage.map((provider) => (
                <div key={provider.providerId} className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="border-muted-foreground/20 border-b text-muted-foreground">
                          <th className="w-[45%] py-2 text-left font-normal pb-3 pl-1">
                            <div className="flex items-center gap-2">
                              <ProviderIcon
                                id={provider.providerId}
                                size="xs"
                              />
                              <h3 className="font-medium text-sm text-foreground">
                                {provider.providerName}
                              </h3>
                            </div>
                          </th>
                          <th className="w-[18%] py-2 pb-1 text-right font-normal">
                            Requests
                          </th>
                          <th className="w-[18%] py-2 pb-1 text-right font-normal">
                            Tokens
                          </th>
                          <th className="w-[19%] py-2 pb-1 text-right font-normal">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="h-1"></tr>
                        {provider.models
                          .sort((a, b) => b.cost - a.cost)
                          .map((model) => (
                            <tr key={model.modelId}>
                              <td className="flex w-[45%] items-center gap-2 truncate py-2 pl-1">
                                <ModelIcon tag={model.modelTag} size="xs" />
                                <span className="truncate text-sm">
                                  {model.modelName}
                                </span>
                              </td>
                              <td className="w-[18%] py-2 text-right text-muted-foreground">
                                <NumberFlow value={model.count} />
                              </td>
                              <td className="w-[18%] py-2 text-right text-muted-foreground">
                                <NumberFlow
                                  value={model.inputTokens + model.outputTokens}
                                />
                              </td>
                              <td className="w-[19%] py-2 text-right text-muted-foreground">
                                <NumberFlow
                                  className="text-sm overflow-hidden"
                                  value={model.cost}
                                  format={{
                                    currency: "USD",
                                    maximumFractionDigits: 6,
                                  }}
                                  prefix="$"
                                />
                              </td>
                            </tr>
                          ))}
                        <tr className="h-1"></tr>
                      </tbody>
                    </table>

                    <div className="flex justify-end border-muted-foreground/20 border-t pt-2">
                      <span className="font-semibold text-sm">
                        <NumberFlow
                          className="text-sm overflow-hidden"
                          value={provider.totalCost}
                          prefix="$"
                          format={{
                            currency: "USD",
                            maximumFractionDigits: 6,
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20">
              <EmptyStateDetails
                title="No provider usage data"
                description="Run the workflows to see the provider usage data"
                icon={<Bot className="size-4" />}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
