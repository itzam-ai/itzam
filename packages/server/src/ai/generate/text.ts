import { notifyStreamingError } from "@itzam/utils";
import { generateObject, generateText, streamObject, streamText } from "ai";
import type { SSEStreamingApi } from "hono/streaming";
import "server-only";
import { Model } from "../../db/model/actions";
import { createRunWithCost } from "../../db/run/actions";
import { calculateRunCost } from "../../db/run/utils";
import { PreRunDetails } from "../../types";
import type { AiParams } from "../types";
import { handleRunCompletion } from "../utils";

export async function generateTextOrObjectStream(
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

  try {
    const response =
      type === "object"
        ? streamObject({
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
                text: JSON.stringify(object),
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

              // Send Discord notification for streaming errors
              if (error instanceof Error) {
                await notifyStreamingError(error, {
                  runId: run.id,
                  streamType: "object",
                });
              }

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
          })
        : streamText({
            ...aiParams,
            onFinish: async ({ text, usage }) => {
              if (!text) {
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
                text,
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

              // Send Discord notification for streaming errors
              if (error instanceof Error) {
                await notifyStreamingError(error, {
                  runId: run.id,
                  streamType: "text",
                });
              }

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

        // Pass all events through, including tool-related events
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

    // Playground implementation
    // --------------------------
    // Create a readable stream from the object events, extracting only text content
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response.fullStream) {
            if (event.type === "error") {
              console.error("Error during streaming:", event.error);

              controller.enqueue(
                encoder.encode(
                  `\n\n<!-- ERROR: ${event.error || "Unknown streaming error"} -->`
                )
              );
              controller.close();
              return;
            } else if (event.type === "finish") {
              // Calculate final metadata
              inputTokens = event.usage?.promptTokens || 0;
              outputTokens = event.usage?.completionTokens || 0;
              durationInMs = Date.now() - startTime;

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

              // Send metadata as a special event (optional, for debugging)
              controller.enqueue(
                encoder.encode(
                  `\n\n<!-- METADATA: ${JSON.stringify(metadata)} -->`
                )
              );
            } else if (event.type === "text-delta") {
              controller.enqueue(encoder.encode(event.textDelta));
            }
          }

          controller.close();
        } catch (error) {
          console.error("Error during streaming:", error);
          controller.enqueue(
            encoder.encode(
              `\n\nERROR: ${error instanceof Error ? error.message : "Unknown error"}`
            )
          );
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Handle errors that occur before streaming starts
    console.error("Error before streaming:", error);

    await handleRunCompletion({
      run,
      model,
      text: "",
      inputTokens: 0,
      outputTokens: 0,
      startTime,
      status: "FAILED",
      fullResponse: null,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Return an error response that can be caught by the API route
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

export async function generateTextResponse(
  aiParams: AiParams,
  run: PreRunDetails,
  model: Model,
  startTime: number
) {
  const response = await generateText(aiParams);

  // ⏰ End timing
  const endTime = Date.now();
  const durationInMs = endTime - startTime;

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

  await createRunWithCost({
    ...run,
    metadata: { metadata, aiParams },
    model: model,
    status: "COMPLETED",
    output: response.text,
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
    text: response.text,
    metadata: {
      cost: cost.toString(),
      ...metadata,
    },
  };
}

export async function generateObjectResponse(
  aiParams: AiParams,
  run: PreRunDetails,
  model: Model,
  startTime: number
) {
  const response = await generateObject({
    ...aiParams,
    // @ts-expect-error TODO: fix typing
    schema: aiParams.schema,
  });

  // ⏰ End timing
  const endTime = Date.now();
  const durationInMs = endTime - startTime;

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

  await createRunWithCost({
    ...run,
    metadata: { metadata, aiParams },
    model: model,
    status: "COMPLETED",
    output: JSON.stringify(response.object),
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
    object: response.object,
    metadata: {
      cost: cost.toString(),
      ...metadata,
    },
  };
}
