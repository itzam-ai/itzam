"use server";
import { addDays, endOfDay, subDays } from "date-fns";
import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "..";
import type { AttachmentWithUrl } from "../../ai/types";
import { sendDiscordNotification } from "../../discord/actions";
import { getCustomerSubscriptionStatus } from "../billing/actions";
import {
  attachments as attachmentsTable,
  type models,
  runResources,
  runs,
} from "../schema";
import { calculateRunCost } from "./utils";
export type Run = typeof runs.$inferSelect;

export type RunWithModel = NonNullable<Awaited<ReturnType<typeof getRunById>>>;

export async function getRunById(runId: string) {
  return await db.query.runs.findFirst({
    where: eq(runs.id, runId),
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

export type RunWithModelAndResourcesAndAttachmentsAndThreads = NonNullable<
  Awaited<ReturnType<typeof getLast30RunsInTheLastDays>>[number]
>;
export async function getRunByIdAndUserId(runId: string, userId: string) {
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, runId),
    with: {
      model: true,
      workflow: {
        with: {
          knowledge: true,
          contexts: true,
        },
      },
      attachments: true,
      runResources: {
        with: {
          resource: {
            columns: {
              id: true,
              title: true,
              fileName: true,
              url: true,
              type: true,
            },
            with: {
              context: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!run || !run.workflow || run.workflow.userId !== userId) {
    return null;
  }

  return run;
}

export async function getLast30RunsInTheLastDays(workflowId: string) {
  const { plan } = await getCustomerSubscriptionStatus();

  return await db.query.runs.findMany({
    where: and(
      eq(runs.workflowId, workflowId),
      sql`${runs.createdAt} >= ${addDays(new Date(), plan === "pro" ? -30 : -7).toISOString()}`
    ),
    orderBy: (runs, { desc }) => [desc(runs.createdAt)],
    with: {
      model: {
        with: {
          provider: true,
        },
      },
      runResources: {
        with: {
          resource: true,
        },
      },
      thread: {
        with: {
          lookupKeys: true,
        },
      },
      workflow: {
        with: {
          knowledge: true,
          contexts: true,
        },
      },
      attachments: true,
    },
    limit: 30,
  });
}

export async function getRunsByWorkflowId(
  workflowId: string,
  page = 1,
  params: {
    modelId?: string;
    threadId?: string;
    status?: "RUNNING" | "COMPLETED" | "FAILED";
    startDate?: string;
    endDate?: string;
  },
  sort: string | undefined = "createdAt:desc"
) {
  const limit = 50;
  const offset = (page - 1) * limit;

  const { plan } = await getCustomerSubscriptionStatus();

  const whereConditions = [eq(runs.workflowId, workflowId)];

  if (params.modelId) {
    whereConditions.push(eq(runs.modelId, params.modelId));
  }

  if (params.threadId) {
    whereConditions.push(eq(runs.threadId, params.threadId));
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
    if (plan === "pro") {
      startDateUsedInQuery = startDateTimeFromParams;
      endDateUsedInQuery = endDateTimeFromParams;
      // Basic user can only select dates in the last 30 days, free users can only select dates in the last 7 days
    } else {
      // If the start date or end date is more than 30 for basic users or 7 for free users ago, we set the params to last 30 or 7 days
      if (
        startDateTimeFromParams <
          addDays(new Date(), plan === "basic" ? -30 : -7) ||
        endDateTimeFromParams < addDays(new Date(), plan === "basic" ? -30 : -7)
      ) {
        startDateUsedInQuery = addDays(new Date(), plan === "basic" ? -30 : -7);
        endDateUsedInQuery = endOfDay(new Date());
      } else {
        startDateUsedInQuery = startDateTimeFromParams;
        endDateUsedInQuery = endDateTimeFromParams;
      }
    }
  } else {
    startDateUsedInQuery =
      plan === "pro"
        ? new Date(0)
        : addDays(new Date(), plan === "basic" ? -30 : -7);
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
      model: {
        with: {
          provider: true,
        },
      },
      runResources: {
        with: {
          resource: true,
        },
      },
      thread: {
        with: {
          lookupKeys: true,
        },
      },
      workflow: {
        with: {
          knowledge: true,
          contexts: true,
        },
      },
      attachments: true,
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
    threadId?: string;
    status?: "RUNNING" | "COMPLETED" | "FAILED";
    startDate?: string;
    endDate?: string;
  }
): Promise<number> {
  const { plan } = await getCustomerSubscriptionStatus();

  const whereConditions = [eq(runs.workflowId, workflowId)];

  if (params.modelId) {
    whereConditions.push(eq(runs.modelId, params.modelId));
  }

  if (params.threadId) {
    whereConditions.push(eq(runs.threadId, params.threadId));
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
    if (plan === "pro") {
      startDateUsedInQuery = startDateTimeFromParams;
      endDateUsedInQuery = endDateTimeFromParams;
      // Basic user can only select dates in the last 30 days, free users can only select dates in the last 7 days
    } else {
      // If the start date or end date is more than 30 for basic users or 7 for free users ago, we set the params to last 30 or 7 days
      if (
        startDateTimeFromParams <
          addDays(new Date(), plan === "basic" ? -30 : -7) ||
        endDateTimeFromParams < addDays(new Date(), plan === "basic" ? -30 : -7)
      ) {
        startDateUsedInQuery = addDays(new Date(), plan === "basic" ? -30 : -7);
        endDateUsedInQuery = endOfDay(new Date());
      } else {
        startDateUsedInQuery = startDateTimeFromParams;
        endDateUsedInQuery = endDateTimeFromParams;
      }
    }
  } else {
    startDateUsedInQuery =
      plan === "pro"
        ? new Date(0)
        : addDays(new Date(), plan === "basic" ? -30 : -7);
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
  attachments?: AttachmentWithUrl[];
};

const knownWorkflows: Record<string, string> = {
  "0196cb31-efc9-722c-85ed-deba59255e75": "Lisa",
  "0196ef82-e163-76cb-be40-5875f9f3b9a8": "File title generator",
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

  if (!run.workflowId) {
    throw new Error("Workflow ID is required");
  }

  const workflowLabel = knownWorkflows[run.workflowId] ?? run.workflowId;

  await sendDiscordNotification({
    content: `🤖 **NEW RUN:**\n${workflowLabel} - ${run.origin} - ${run.durationInMs}ms - ${runCost.toString()} - ${run.model.name}`,
  });

  await db.insert(runs).values({
    ...run,
    cost: runCost.toString(),
  });

  // Add resources to run
  if (run.resourceIds && run.resourceIds.length > 0) {
    await addResourcesToRun(run.id, run.resourceIds);
  }

  // Add attachments to run
  if (run.attachments && run.attachments.length > 0) {
    await addAttachmentsToRun(run.id, run.attachments);
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

export async function getRunsForContextByThreadId(threadId: string) {
  return await db.query.runs.findMany({
    where: and(
      eq(runs.threadId, threadId),
      eq(runs.status, "COMPLETED") // Only get completed runs for conversation history
    ),
    orderBy: (runs, { asc }) => [asc(runs.createdAt)],
    with: {
      attachments: true,
    },
  });
}

export type RunWithResourcesAndAttachments = Awaited<
  ReturnType<typeof getRunsByThreadIdWithResourcesAndAttachments>
>[number];

export async function getRunsByThreadIdWithResourcesAndAttachments(
  threadId: string
) {
  return await db.query.runs.findMany({
    where: and(
      eq(runs.threadId, threadId),
      eq(runs.status, "COMPLETED") // Only get completed runs for conversation history
    ),
    orderBy: (runs, { asc }) => [asc(runs.createdAt)],
    with: {
      model: {
        with: {
          provider: true,
        },
      },
      attachments: true,
      runResources: {
        with: {
          resource: {
            columns: {
              id: true,
              title: true,
              fileName: true,
              url: true,
              type: true,
            },
            with: {
              context: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function addAttachmentsToRun(
  runId: string,
  attachments: AttachmentWithUrl[]
) {
  await db.insert(attachmentsTable).values(
    attachments.map((attachment) => ({
      id: uuidv4(),
      runId,
      url: attachment.url,
      mimeType: attachment.mimeType || "application/octet-stream",
    }))
  );
}
