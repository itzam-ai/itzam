import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

import { generateObjectResponse } from "@itzam/server/ai/generate/text";
import { createAiParams } from "@itzam/server/ai/utils";

export const POST = verifySignatureAppRouter(async (request: Request) => {
  const { run, workflow, callback, schema, input } = await request.json();
  const aiParams = await createAiParams({
    userId: workflow.userId,
    input,
    prompt: workflow.prompt,
    model: workflow.model,
    schema,
    attachments: [],
    run,
  });

  const startTime = new Date().getTime();

  if ("error" in aiParams) {
    return new Response(aiParams.error, {
      status: aiParams.status,
    });
  }

  try {
    const { object, metadata } = await generateObjectResponse(
      aiParams,
      run,
      workflow.model,
      startTime
    );

    await fetch(callback.url, {
      method: "POST",
      body: JSON.stringify({
        object,
        metadata,
        customProperties: callback.customProperties,
      }),
      headers: callback.headers,
    });

    return new Response("Success!", {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      `Webhook error: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        status: 400,
      }
    );
  }
});
