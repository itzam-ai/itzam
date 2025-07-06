import { getUser } from "@itzam/server/db/auth/actions";
import {
  createThread,
  getThreadById,
  getThreadRunsHistory,
  getThreadsByWorkflowSlug,
} from "@itzam/server/db/thread/actions";
import { workflows } from "@itzam/server/db/schema";
import { db } from "@itzam/server/db/index";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (user.error || !user.data.user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.data.user.id;
    const { name, lookupKeys, workflowSlug, contextSlugs } =
      await request.json();

    if (!workflowSlug) {
      return Response.json(
        { error: "workflowSlug is required" },
        { status: 400 }
      );
    }

    // Find the workflow by slug and userId
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.slug, workflowSlug),
        eq(workflows.userId, userId),
        eq(workflows.isActive, true)
      ),
    });

    if (!workflow) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }

    const thread = await createThread({
      workflowId: workflow.id,
      lookupKeys,
      name,
      contextSlugs,
    });

    if (!thread || "error" in thread) {
      return Response.json(
        { error: "Failed to create thread" },
        { status: 500 }
      );
    }

    return Response.json({
      id: thread.id,
      name: thread.name,
      lookupKeys: thread.lookupKeys,
      contextSlugs: thread.contextSlugs,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (user.error || !user.data.user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.data.user.id;
    const { searchParams } = new URL(request.url);

    // Check if this is a request for a specific thread
    const threadId = searchParams.get("threadId");
    if (threadId) {
      const thread = await getThreadById(threadId, userId);

      if (!thread) {
        return Response.json({ error: "Thread not found" }, { status: 404 });
      }

      return Response.json(thread);
    }

    // Check if this is a request for thread runs
    const threadIdForRuns = searchParams.get("threadIdForRuns");
    if (threadIdForRuns) {
      const runs = await getThreadRunsHistory(threadIdForRuns, userId);

      return Response.json({
        runs: runs.map((run) => ({
          id: run.id,
          origin: run.origin,
          status: run.status,
          input: run.input,
          output: run.output ?? "",
          prompt: run.prompt,
          inputTokens: run.inputTokens,
          outputTokens: run.outputTokens,
          cost: run.cost,
          durationInMs: run.durationInMs,
          threadId: run.threadId ?? null,
          model: {
            name: run.model?.name ?? "",
            tag: run.model?.tag ?? "",
          },
          attachments: run.attachments.map((attachment) => ({
            id: attachment.id,
            url: attachment.url,
            mimeType: attachment.mimeType,
          })),
          knowledge: run.runResources.map((resource) => ({
            id: resource.resource.id,
            title: resource.resource.title,
            url: resource.resource.url,
            type: resource.resource.type,
            context: resource.resource.context
              ? {
                  id: resource.resource.context.id,
                  slug: resource.resource.context.slug,
                  name: resource.resource.context.name,
                }
              : null,
          })),
          workflowId: run.workflowId ?? "",
          createdAt: run.createdAt.toISOString(),
        })),
      });
    }

    // Otherwise, get threads by workflow
    const workflowSlug = searchParams.get("workflowSlug");
    if (!workflowSlug) {
      return Response.json(
        { error: "workflowSlug is required" },
        { status: 400 }
      );
    }

    const lookupKeysParam = searchParams.get("lookupKeys");
    const lookupKeys = lookupKeysParam ? lookupKeysParam.split(",") : undefined;

    const threads = await getThreadsByWorkflowSlug(workflowSlug, userId, {
      lookupKeys,
    });

    return Response.json({
      threads: threads.map((thread) => ({
        id: thread.id,
        name: thread.name,
        lookupKeys: thread.lookupKeys.map((key) => key.lookupKey),
        contextSlugs: thread.threadContexts.map(
          (context) => context.context.slug
        ),
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in threads GET:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
