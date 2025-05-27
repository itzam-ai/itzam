import { generateTextStream } from "@itzam/server/ai/generate/text";
import { createAiParams } from "@itzam/server/ai/utils";
import { getUser } from "@itzam/server/db/auth/actions";
import { db } from "@itzam/server/db/index";
import { type Model, getModelById } from "@itzam/server/db/model/actions";
import { workflows } from "@itzam/server/db/schema";
import { generateText } from "@itzam/server/playground/actions";
import type { PreRunDetails } from "@itzam/server/types";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { v7 as uuidv7 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { input, prompt, modelId, streaming, workflowId, userId } =
      await request.json();

    if (!input || !prompt || !userId || !workflowId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await getUser();

    if (user.error || !user.data.user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const model = await getModelById(modelId);

    if (!model) {
      return Response.json({ error: "Model not found" }, { status: 404 });
    }

    const run: PreRunDetails = {
      id: uuidv7(),
      origin: "WEB" as const,
      input,
      prompt,
      threadId: null,
      modelId: modelId,
      workflowId: workflowId,
      resourceIds: [],
    };

    const aiParams = await createAiParams({
      input,
      prompt,
      model: model as Model,
      stream: streaming,
      userId,
      run,
    });

    if (streaming) {
      const response = await generateTextStream(
        aiParams,
        run,
        model,
        new Date().getTime(),
        undefined,
        "object"
      );

      return response;
    }

    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }

    const result = await generateText(input, prompt, modelId, workflow.slug);
    return Response.json(result);
  } catch (error) {
    console.error("Error in text generation:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
