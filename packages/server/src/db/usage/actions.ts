"use server";

import {
  addDays,
  differenceInDays,
  format,
  startOfDay,
  subDays,
} from "date-fns";
import Decimal from "decimal.js";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "..";
import { getUser } from "../auth/actions";
import { getCustomerSubscriptionStatus } from "../billing/actions";
import { models, providers, runs, workflows } from "../schema";

interface DailyCost {
  date: string;
  cost: number;
  count: number;
}

interface ModelUsage {
  modelId: string;
  modelName: string;
  modelTag: string;
  providerId: string;
  providerName: string;
  cost: number;
  count: number;
  inputTokens: number;
  outputTokens: number;
}

export type UsageInformation = Awaited<
  ReturnType<typeof getCurrentMonthUsageInformation>
>;

export async function getCurrentMonthUsageInformation() {
  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Failed to get user" };
  }

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Get runs with model information
  const runData = await db
    .select({
      run: runs,
      model: models,
      provider: providers,
    })
    .from(runs)
    .innerJoin(workflows, eq(runs.workflowId, workflows.id))
    .innerJoin(models, eq(runs.modelId, models.id))
    .leftJoin(providers, eq(models.providerId, providers.id))
    .where(
      and(
        eq(workflows.userId, user.data.user?.id ?? ""),
        gte(runs.createdAt, startDate),
        lt(runs.createdAt, endDate)
      )
    );

  // Calculate model usage
  const modelUsageMap = new Map<string, ModelUsage>();

  runData.forEach((row) => {
    const modelId = row.model.id;
    if (!modelUsageMap.has(modelId)) {
      modelUsageMap.set(modelId, {
        modelId: modelId,
        modelName: row.model.name,
        modelTag: row.model.tag,
        providerId: row.provider ? row.provider.id : "unknown",
        providerName: row.provider ? row.provider.name : "Unknown Provider",
        cost: 0,
        count: 0,
        inputTokens: 0,
        outputTokens: 0,
      });
    }

    const usage = modelUsageMap.get(modelId)!;
    usage.cost += Number(row.run.cost);
    usage.count += 1;
    usage.inputTokens += row.run.inputTokens;
    usage.outputTokens += row.run.outputTokens;
  });

  // Group by provider
  const providerUsage: Record<
    string,
    {
      providerId: string;
      providerName: string;
      totalCost: number;
      models: ModelUsage[];
    }
  > = {};

  Array.from(modelUsageMap.values()).forEach((modelUsage) => {
    if (!providerUsage[modelUsage.providerId]) {
      providerUsage[modelUsage.providerId] = {
        providerId: modelUsage.providerId,
        providerName: modelUsage.providerName,
        totalCost: 0,
        models: [],
      };
    }

    providerUsage[modelUsage.providerId]!.models.push(modelUsage);
    providerUsage[modelUsage.providerId]!.totalCost += modelUsage.cost;
  });

  const totalRequests = runData.length;
  const totalInputTokens = runData.reduce(
    (sum, row) => sum + row.run.inputTokens,
    0
  );
  const totalOutputTokens = runData.reduce(
    (sum, row) => sum + row.run.outputTokens,
    0
  );
  const totalCost = runData.reduce((sum, row) => sum + Number(row.run.cost), 0);

  return {
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    providerUsage: Object.values(providerUsage).sort(
      (a, b) => b.totalCost - a.totalCost
    ),
    runs: runData.map((row) => ({
      id: row.run.id,
      createdAt: row.run.createdAt,
      inputTokens: row.run.inputTokens,
      outputTokens: row.run.outputTokens,
      cost: row.run.cost,
      workflowId: row.run.workflowId,
      modelId: row.run.modelId,
      modelName: row.model.name,
      providerName: row.provider ? row.provider.name : "Unknown Provider",
    })),
  };
}

export type UsageChartData = Awaited<ReturnType<typeof getUsageChartData>>;

export async function getUsageChartData(workflowId: string | null) {
  const user = await getUser();

  if (user.error) {
    return { error: "Failed to get user" };
  }

  const { plan } = await getCustomerSubscriptionStatus();
  const maxPeriod = plan === "pro" ? 90 : plan === "basic" ? 30 : 7;

  const today = startOfDay(new Date());
  const startDate = subDays(today, maxPeriod);
  const endDate = addDays(today, 1);

  const runData = await db
    .select({
      run: runs,
      model: models,
      provider: providers,
    })
    .from(runs)
    .innerJoin(workflows, eq(runs.workflowId, workflows.id))
    .innerJoin(models, eq(runs.modelId, models.id))
    .leftJoin(providers, eq(models.providerId, providers.id))
    .where(
      and(
        eq(workflows.userId, user.data.user?.id ?? ""),
        ...(workflowId ? [eq(workflows.id, workflowId)] : []),
        gte(runs.createdAt, startDate),
        lt(runs.createdAt, endDate)
      )
    );

  // Calculate daily cost breakdown
  const dailyCosts: { [key: string]: DailyCost } = {};
  const daysInPeriod = differenceInDays(endDate, startDate);

  // Initialize array with zero costs for each day of the period
  for (let i = 0; i < daysInPeriod; i++) {
    const date = addDays(startDate, i);

    dailyCosts[format(date, "yyyy-MM-dd")] = {
      date: format(date, "yyyy-MM-dd"),
      cost: 0,
      count: 0,
    };
  }

  // Fill in the costs for days with runs
  runData.forEach((row) => {
    if (row.run.createdAt) {
      const runDate = dailyCosts[format(row.run.createdAt, "yyyy-MM-dd")];

      if (runDate) {
        runDate.cost = new Decimal(runDate.cost).plus(row.run.cost).toNumber();
        runDate.count += 1;
      }
    }
  });

  return Object.values(dailyCosts);
}
