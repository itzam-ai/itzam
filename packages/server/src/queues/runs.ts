import { InferInsertModel } from "drizzle-orm";
import { Queue } from "quirrel/next-app";
import { db } from "../db";
import { attachments, runs } from "../db/schema";

export const runsQueue = Queue(
  "api/queues/runs", // 👈 the route it's reachable on
  async (
    job: InferInsertModel<typeof runs> & {
      attachments: InferInsertModel<typeof attachments>[];
    }
  ) => {
    const run = await db.insert(runs).values(job).returning();

    if (job.attachments && job.attachments.length > 0) {
      await db.insert(attachments).values(job.attachments);
    }

    if (!run) {
      throw new Error("Run not found");
    }
  }
);
