import { db } from "@itzam/server/db/index";
import { runs } from "@itzam/server/db/schema";
import { format, subDays } from "date-fns";
import { gte, sql, sum } from "drizzle-orm";
import { ModelUsageData, UserUsageData } from "../models/statistics";

/**
 * Get token usage statistics directly with Drizzle Query API
 */
export async function getTokenUsage() {
  try {
    // Get overview data (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Use SQL query for date operations
    const overviewResults = await db
      .select({
        createdAt: sql<string>`DATE(${runs.createdAt})`.as("date"),
        inputTokens: sum(runs.inputTokens)
          .mapWith(Number)
          .as("totalInputTokens"),
        outputTokens: sum(runs.outputTokens)
          .mapWith(Number)
          .as("totalOutputTokens"),
        cost: sum(runs.cost).mapWith(Number).as("totalCost"),
      })
      .from(runs)
      .where(gte(runs.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${runs.createdAt})`)
      .orderBy(sql`DATE(${runs.createdAt})`);

    return {
      overviewResults,
      totals: {
        inputTokens: overviewResults.reduce(
          (acc, run) => acc + run.inputTokens,
          0
        ),
        outputTokens: overviewResults.reduce(
          (acc, run) => acc + run.outputTokens,
          0
        ),
        cost: overviewResults.reduce((acc, run) => acc + Number(run.cost), 0),
      },
    };
  } catch (error) {
    console.error("Error fetching token usage data:", error);
    throw error;
  }
}

/**
 * Get model usage statistics directly with Drizzle Query API
 */
export async function getModelUsage(): Promise<ModelUsageData> {
  try {
    // Get model distribution using the query API
    const distributionResults = await db
      .select({
        modelId: runs.modelId,
        totalTokens: sum(sql`(${runs.inputTokens} + ${runs.outputTokens})`),
      })
      .from(runs)
      .where(sql`${runs.modelId} IS NOT NULL`)
      .groupBy(runs.modelId);

    // Get model names
    const modelIds = distributionResults
      .map((item) => item.modelId)
      .filter(Boolean) as string[];

    const modelDetails = await db.query.models.findMany({
      columns: {
        id: true,
        name: true,
      },
      where: (models, { inArray }) =>
        modelIds.length > 0 ? inArray(models.id, modelIds) : sql`FALSE`,
    });

    const modelMap = modelDetails.reduce(
      (acc, model) => {
        if (model.id) {
          acc[model.id] = model.name;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    // Format distribution data
    const distribution = distributionResults.map((item) => ({
      name: item.modelId
        ? modelMap[item.modelId] || "Unknown Model"
        : "Unknown Model",
      value: Number(item.totalTokens) || 0,
    }));

    // Calculate performance metrics by model
    const performanceResults = await db
      .select({
        modelId: runs.modelId,
        avgDuration: sql<number>`AVG(${runs.durationInMs})`,
        avgTokens: sql<number>`AVG((${runs.inputTokens} + ${runs.outputTokens}))`,
      })
      .from(runs)
      .where(sql`${runs.modelId} IS NOT NULL`)
      .groupBy(runs.modelId);

    // Format performance data
    const performance = performanceResults.map((item) => ({
      name: item.modelId
        ? modelMap[item.modelId] || "Unknown Model"
        : "Unknown Model",
      avgResponseTime: Number(item.avgDuration) || 0,
      avgTokens: Number(item.avgTokens) || 0,
    }));

    return {
      distribution,
      performance,
    };
  } catch (error) {
    console.error("Error fetching model usage data:", error);
    throw error;
  }
}

/**
 * Get user usage statistics directly with Drizzle Query API
 */
export async function getUserUsage(): Promise<UserUsageData> {
  try {
    // We need SQL for JSONB field access in the user queries
    const topUsersResults = await db.execute(sql`
      SELECT 
        u.id, 
        u.email,
        u.first_name,
        u.last_name,
        SUM(r.input_tokens + r.output_tokens) as tokens
      FROM "user" u
      JOIN "run" r ON r.metadata->>'userId' = u.id
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY tokens DESC
      LIMIT 10
    `);

    // Format top users data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topUsers = topUsersResults.map((row: any) => ({
      id: row.id,
      name:
        row.first_name && row.last_name
          ? `${row.first_name} ${row.last_name}`
          : row.email.split("@")[0],
      tokens: Number(row.tokens) || 0,
    }));

    // Calculate user activity over time (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);

    const activityResults = await db.execute(sql`
      SELECT 
        DATE_TRUNC('day', r.created_at) as date,
        COUNT(DISTINCT r.metadata->>'userId') as "activeUsers"
      FROM "run" r
      WHERE r.created_at >= ${thirtyDaysAgo.toISOString()}
      GROUP BY DATE_TRUNC('day', r.created_at)
      ORDER BY date ASC
    `);

    // Format activity data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activityOverTime = activityResults.map((row: any) => ({
      date: format(new Date(row.date), "MMM dd"),
      activeUsers: Number(row.activeUsers) || 0,
    }));

    // Calculate average cost per user
    const costPerUserResults = await db.execute(sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        AVG(r.cost) as "avgCost"
      FROM "user" u
      JOIN "run" r ON r.metadata->>'userId' = u.id
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY "avgCost" DESC
      LIMIT 10
    `);

    // Format cost per user data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const costPerUser = costPerUserResults.map((row: any) => ({
      id: row.id,
      name:
        row.first_name && row.last_name
          ? `${row.first_name} ${row.last_name}`
          : row.email.split("@")[0],
      avgCost: Number(row.avgCost) || 0,
    }));

    return {
      topUsers,
      activityOverTime,
      costPerUser,
    };
  } catch (error) {
    console.error("Error fetching user usage data:", error);
    throw error;
  }
}
