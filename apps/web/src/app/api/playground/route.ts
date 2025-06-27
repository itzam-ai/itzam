import { generateTextOrObjectStream } from "@itzam/server/ai/generate/text";
import { createAiParams } from "@itzam/server/ai/utils";
import { getUser } from "@itzam/server/db/auth/actions";
import { type Model, getModelById } from "@itzam/server/db/model/actions";
import { getWorkflowByIdWithRelations } from "@itzam/server/db/workflow/actions";
import type { PreRunDetails } from "@itzam/server/types";
import { NextRequest } from "next/server";
import { v7 as uuidv7 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { input, prompt, modelId, workflowId, userId, contextSlugs } =
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

    const workflow = await getWorkflowByIdWithRelations(workflowId);

    if (!workflow || "error" in workflow) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
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
      attachments: [],
      knowledgeId: workflow.knowledgeId,
      contextSlugs: contextSlugs || [],
    };

    const aiParams = await createAiParams({
      input,
      prompt,
      model: model as Model,
      userId,
      run,
    });

    try {
      const response = await generateTextOrObjectStream(
        aiParams,
        run,
        model,
        new Date().getTime(),
        undefined,
        "text"
      );

      // Return the response directly since it's now a proper text stream
      return response;
    } catch (streamError) {
      console.error("Error during text generation streaming:", streamError);
      return Response.json(
        {
          error:
            streamError instanceof Error
              ? streamError.message
              : "Streaming error occurred",
          type: "streaming_error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in text generation:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
