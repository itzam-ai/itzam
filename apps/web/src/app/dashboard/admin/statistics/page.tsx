import { getTokenUsage } from "~/app/dashboard/admin/statistics/statistics";
import UsageChart, {
  CostDistributionChart,
} from "~/app/dashboard/admin/statistics/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default async function StatisticsPage() {
  const tokenData = await getTokenUsage();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Usage Statistics</h1>

      <Tabs defaultValue="token" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="token">Token Usage</TabsTrigger>
          <TabsTrigger value="model">Model Usage</TabsTrigger>
          <TabsTrigger value="user">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="token" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Usage Overview</CardTitle>
              <CardDescription>
                Total input and output tokens used over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <UsageChart tokenData={tokenData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
                <CardDescription>Cost breakdown by usage type</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <CostDistributionChart tokenData={tokenData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Usage</CardTitle>
                <CardDescription>Aggregate statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Total Input Tokens</p>
                    <p className="text-2xl font-bold">
                      {tokenData.totals.inputTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Output Tokens</p>
                    <p className="text-2xl font-bold">
                      {tokenData.totals.outputTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-2xl font-bold">
                      ${tokenData.totals.cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}