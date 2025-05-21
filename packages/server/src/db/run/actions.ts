"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "..";
import { sendDiscordNotification } from "../../discord/actions";
import { models, runResources, runs } from "../schema";
import { calculateRunCost } from "./utils";
import { customerIsSubscribedToItzamPro } from "../billing/actions";
import { addDays, endOfDay, subDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
export type Run = typeof runs.$inferSelect;

export type RunWithModel = NonNullable<Awaited<ReturnType<typeof getRunById>>>;

export async function getRunById(runId: string) {
  return await db.query.runs.findFirst({
    where: eq(runs.id, runId),
    with: {
      model: true,
    },
  });
}

export async function getRunByIdAndUserId(runId: string, userId: string) {
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
    with: {
      model: true,
      workflow: true,
    },
  });

  if (!run || !run.workflow || run.workflow.userId !== userId) {
    return null;
  }

  return run;
}

export type RunWithModelAndResources = NonNullable<
  Awaited<ReturnType<typeof getRunsInTheLast30Days>>[number]
>;

export async function getRunsInTheLast30Days(workflowId: string) {
  return await db.query.runs.findMany({
    where: and(
      eq(runs.workflowId, workflowId),
      sql`${runs.createdAt} >= ${addDays(new Date(), -30).toISOString()}`
    ),
    orderBy: (runs, { desc }) => [desc(runs.createdAt)],
    with: {
      model: true,
      runResources: {
        with: {
          resource: true,
        },
      },
    },
  });
}

export async function getRunsByWorkflowId(
  workflowId: string,
  page: number = 1,
  params: {
    modelId?: string;
    groupId?: string;
    status?: "RUNNING" | "COMPLETED" | "FAILED";
    startDate?: string;
    endDate?: string;
  },
  sort: string | undefined = "createdAt:desc"
) {
  const limit = 10;
  const offset = (page - 1) * limit;

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();

  const whereConditions = [eq(runs.workflowId, workflowId)];

  if (params.modelId) {
    whereConditions.push(eq(runs.modelId, params.modelId));
  }

  if (params.groupId) {
    whereConditions.push(eq(runs.groupId, params.groupId));
  }

  if (params.status) {
    whereConditions.push(eq(runs.status, params.status));
  }

  let startDateUsedInQuery: Date;
  let endDateUsedInQuery: Date;

  // Date params
  if (params.startDate && params.endDate) {
    const startDateTimeFromParams = new Date(params.startDate);
    const endDateTimeFromParams = new Date(params.endDate);

    // Pro user can select any date in the past
    if (isSubscribedToItzamPro.isSubscribed) {
      startDateUsedInQuery = startDateTimeFromParams;
      endDateUsedInQuery = endDateTimeFromParams;
      // Unsubscribed user can only select dates in the last 30 days
    } else {
      // If the start date or end date is more than 30 days ago, we set the params to last 30 days
      if (
        startDateTimeFromParams < addDays(new Date(), -30) ||
        endDateTimeFromParams < addDays(new Date(), -30)
      ) {
        startDateUsedInQuery = addDays(new Date(), -30);
        endDateUsedInQuery = endOfDay(new Date());
      } else {
        startDateUsedInQuery = startDateTimeFromParams;
        endDateUsedInQuery = endDateTimeFromParams;
      }
    }
  } else {
    startDateUsedInQuery = isSubscribedToItzamPro.isSubscribed
      ? new Date(0)
      : addDays(new Date(), -30);
    endDateUsedInQuery = endOfDay(new Date());
  }

  whereConditions.push(
    sql`${runs.createdAt} >= ${startDateUsedInQuery.toISOString()}`
  );
  whereConditions.push(
    sql`${runs.createdAt} <= ${endDateUsedInQuery.toISOString()}`
  );

  const orderBy = sort?.split(":")[0] ?? "createdAt";
  const order = sort?.split(":")[1] ?? "desc";

  return await db.query.runs.findMany({
    where: sql`${sql.join(whereConditions, sql` AND `)}`,
    with: {
      model: true,
      runResources: {
        with: {
          resource: true,
        },
      },
    },
    orderBy: (runs, { desc, asc }) => [
      order === "desc"
        ? desc(runs[orderBy as keyof typeof runs])
        : asc(runs[orderBy as keyof typeof runs]),
    ],
    offset,
    limit,
  });
}

export async function getRunsCount(
  workflowId: string,
  params: {
    modelId?: string;
    groupId?: string;
    status?: "RUNNING" | "COMPLETED" | "FAILED";
    startDate?: string;
    endDate?: string;
  }
): Promise<number> {
  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();

  const whereConditions = [eq(runs.workflowId, workflowId)];

  if (params.modelId) {
    whereConditions.push(eq(runs.modelId, params.modelId));
  }

  if (params.groupId) {
    whereConditions.push(eq(runs.groupId, params.groupId));
  }

  if (params.status) {
    whereConditions.push(eq(runs.status, params.status));
  }

  let startDateUsedInQuery: Date;
  let endDateUsedInQuery: Date;

  // Date params
  if (params.startDate && params.endDate) {
    const startDateTime = new Date(params.startDate);
    const endDateTime = new Date(params.endDate);

    startDateUsedInQuery = startDateTime;
    endDateUsedInQuery = endDateTime;

    // Pro user can select any date in the past
    if (isSubscribedToItzamPro.isSubscribed) {
      startDateUsedInQuery = addDays(new Date(), -30);
      endDateUsedInQuery = endOfDay(new Date());
      // Unsubscribed user can only select dates in the last 30 days
    } else {
      // If the start date or end date is more than 30 days ago, we set the params to last 30 days
      if (
        startDateTime < addDays(new Date(), -30) ||
        endDateTime < addDays(new Date(), -30)
      ) {
        startDateUsedInQuery = addDays(new Date(), -30);
        endDateUsedInQuery = endOfDay(new Date());
      } else {
        startDateUsedInQuery = startDateTime;
        endDateUsedInQuery = endDateTime;
      }
    }
  } else {
    startDateUsedInQuery = new Date(0);
    endDateUsedInQuery = endOfDay(new Date());
  }

  whereConditions.push(
    sql`${runs.createdAt} >= ${startDateUsedInQuery.toISOString()}`
  );
  whereConditions.push(
    sql`${runs.createdAt} <= ${endDateUsedInQuery.toISOString()}`
  );

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(runs)
    .where(sql`${sql.join(whereConditions, sql` AND `)}`);

  return result[0]?.count ?? 0;
}

export async function getLast7DaysRunsCountByDay(
  workflowId: string
): Promise<{ date: string; count: number }[]> {
  const sevenDaysAgo = subDays(new Date(), 6);

  const result = await db
    .select({
      date: sql<string>`TO_CHAR(${runs.createdAt}, 'YYYY-MM-DD')`.as("date"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(runs)
    .where(
      sql`${runs.workflowId} = ${workflowId} AND ${runs.createdAt} >= ${sevenDaysAgo.toISOString()}`
    )
    .groupBy(sql`TO_CHAR(${runs.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${runs.createdAt}, 'YYYY-MM-DD')`);

  // Generate all dates in the last 7 days
  const allDates: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    allDates.push({ date: dateStr ?? "", count: 0 });
  }

  // Merge query results with all dates
  const resultMap = new Map<string, number>();
  for (const item of result) {
    // Using type assertion to handle the potential undefined value
    const dateValue = item.date as string;
    resultMap.set(dateValue, item.count);
  }

  return allDates.map((item) => ({
    date: item.date,
    count: resultMap.get(item.date) ?? 0,
  }));
}

export type CreateRunInput = Omit<
  Run,
  "createdAt" | "updatedAt" | "cost" | "error"
> & {
  error?: string | null;
  resourceIds?: string[];
};

export async function createRunWithCost(
  run: CreateRunInput & { model: typeof models.$inferSelect }
) {
  const runCost = calculateRunCost(
    run.model.inputPerMillionTokenCost ?? "0",
    run.model.outputPerMillionTokenCost ?? "0",
    run.inputTokens,
    run.outputTokens
  );

  await sendDiscordNotification({
    content: `🤖 - New run in workflow ${run.workflowId} (origin: ${run.origin}, duration (ms): ${run.durationInMs}, cost: ${runCost.toString()}, model: ${run.model.name})`,
  });

  await db.insert(runs).values({
    ...run,
    cost: runCost.toString(),
  });

  if (run.resourceIds && run.resourceIds.length > 0) {
    await addResourcesToRun(run.id, run.resourceIds);
  }
}

export async function addResourcesToRun(runId: string, resourceIds: string[]) {
  await db.insert(runResources).values(
    resourceIds.map((resourceId) => ({
      id: uuidv4(),
      runId,
      resourceId,
    }))
  );
}
