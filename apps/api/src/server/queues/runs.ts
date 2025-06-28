import { db } from "@itzam/server/db/index";
import { attachments, runs } from "@itzam/server/db/schema";
import Queue from "bull";

type NewRun = typeof runs.$inferInsert & {
	attachments: (typeof attachments.$inferInsert)[];
};

const newRunQueue = new Queue<NewRun>("create-run");

export const createRunInDb = async (run: NewRun) => {
	const job = await newRunQueue.add(run);
	return job;
};

newRunQueue.process(async (job) => {
	const run = await db.insert(runs).values(job.data).returning();

	if (job.data.attachments && job.data.attachments.length > 0) {
		await db.insert(attachments).values(job.data.attachments);
	}

	if (!run) {
		throw new Error("Run not found");
	}
});
