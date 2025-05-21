import { generateObject, streamObject, streamText } from "ai";
import type { SSEStreamingApi } from "hono/streaming";
import "server-only";
import { Model } from "../../db/model/actions";
import { createRunWithCost } from "../../db/run/actions";
import { calculateRunCost } from "../../db/run/utils";
import { PreRunDetails } from "../../types";
import type { AiParams } from "../types";
import { type GenerationResponse, handleRunCompletion } from "../utils";

export async function generateTextStream(
  aiParams: AiParams,
  run: PreRunDetails,
  model: Model,
  startTime: number,
  streamSSE?: SSEStreamingApi,
  type: "text" | "object" = "text"
) {
  let inputTokens = 0;
  let outputTokens = 0;
  let durationInMs = 0;
  let metadata = {};

  const response = streamObject({
    ...aiParams,
    output: aiParams.output ?? "no-schema",
    onFinish: async ({ object, usage }) => {
      if (!object) {
        await handleRunCompletion({
          run,
          model,
          text: "",
          inputTokens: 0,
          outputTokens: 0,
          startTime,
          status: "FAILED",
          fullResponse: response,
          metadata: { error: "No object returned" },
        });
        return;
      }

      inputTokens = usage?.promptTokens || 0;
      outputTokens = usage?.completionTokens || 0;
      durationInMs = Date.now() - startTime;

      await handleRunCompletion({
        run,
        model,
        // if output is provided, convert the object to a string
        // otherwise, use the object directly if it's a string, or try to get its text property
        text: type === "object" ? JSON.stringify(object) : (object as any).text,
        inputTokens: usage?.promptTokens || 0,
        outputTokens: usage?.completionTokens || 0,
        startTime,
        status: "COMPLETED",
        fullResponse: response,
        metadata,
      });
    },
    onError: async ({ error }) => {
      console.error("Error during streaming:", error);
      await handleRunCompletion({
        run,
        model,
        text: "",
        inputTokens: 0,
        outputTokens: 0,
        startTime,
        status: "FAILED",
        fullResponse: response,
        metadata: { error },
        error: error as string,
      });
    },
  });

  if (streamSSE) {
    for await (const event of response.fullStream) {
      if (event.type === "finish") {
        metadata = {
          runId: run.id,
          model: {
            name: model.name,
            tag: model.tag,
          },
          inputTokens: event.usage?.promptTokens || 0,
          outputTokens: event.usage?.completionTokens || 0,
          durationInMs: Date.now() - startTime,
          cost: calculateRunCost(
            model.inputPerMillionTokenCost ?? "0",
            model.outputPerMillionTokenCost ?? "0",
            event.usage?.promptTokens || 0,
            event.usage?.completionTokens || 0
          ).toString(),
        };
        delete (event as unknown as { response: unknown }).response;
        (event as unknown as { metadata: unknown }).metadata = metadata;
      }

      await streamSSE?.writeSSE({
        data: JSON.stringify(event),
        event: event.type,
      });

      if (event.type === "finish") {
        streamSSE?.close();
      }
    }

    return new Response(undefined, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Create a readable stream from the partial objects
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response.textStream) {
          // Send content as 'text' event
          controller.enqueue(encoder.encode(`event: text\ndata: ${chunk}\n\n`));
        }

        // Send metadata as a special 'metadata' event at the end
        const metadata = {
          runId: run.id,
          model: {
            name: model.name,
            tag: model.tag,
          },
          inputTokens,
          outputTokens,
          durationInMs,
          cost: calculateRunCost(
            model.inputPerMillionTokenCost ?? "0",
            model.outputPerMillionTokenCost ?? "0",
            inputTokens,
            outputTokens
          ).toString(),
        };

        controller.enqueue(
          encoder.encode(
            `event: metadata\ndata: ${JSON.stringify(metadata)}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error("Error during streaming:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function generateTextResponse(
  aiParams: AiParams,
  run: PreRunDetails,
  model: Model,
  startTime: number
) {
  // @ts-expect-error TODO: fix typing
  const response = await generateObject<GenerationResponse>(aiParams);

  const responseTime = Date.now();

  console.log("🕰️ Time before reporting usage: " + (responseTime - startTime));

  // ⏰ End timing
  const endTime = Date.now();
  const durationInMs = endTime - startTime;

  console.log("🕰️ Total time:", endTime - startTime);

  const metadata = {
    model: {
      name: model.name,
      tag: model.tag,
    },
    durationInMs,
    inputTokens: response.usage?.promptTokens || 0,
    outputTokens: response.usage?.completionTokens || 0,
    runId: run.id,
  };

  void createRunWithCost({
    ...run,
    metadata: { metadata, aiParams },
    model: model,
    status: "COMPLETED",
    output: response.object.text,
    inputTokens: response.usage?.promptTokens || 0,
    outputTokens: response.usage?.completionTokens || 0,
    durationInMs,
    fullResponse: response,
  });

  const cost = calculateRunCost(
    model.inputPerMillionTokenCost ?? "0",
    model.outputPerMillionTokenCost ?? "0",
    response.usage?.promptTokens || 0,
    response.usage?.completionTokens || 0
  );

  return {
    output: response.object,
    metadata: {
      cost: cost.toString(),
      ...metadata,
    },
  };
}
