import { createUserProviderRegistry } from "@itzam/server/ai/registry";
import { getCustomerSubscriptionStatus } from "@itzam/server/db/billing/actions";
import {
  getChatById,
  howManyMessagesSentToday,
  saveChat,
} from "@itzam/server/db/chat/actions";
import {
  appendClientMessage,
  appendResponseMessages,
  createIdGenerator,
  Message,
  streamText,
} from "ai";
import { MAX_MESSAGES_PER_DAY } from "~/lib/config";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { message, id, modelTag } = await req.json();

  if (!id) {
    return new Response("No id provided", { status: 400 });
  }

  const messagesSentToday = await howManyMessagesSentToday();

  // load the previous messages from the server:
  const chat = await getChatById(id);

  if (!chat) {
    return new Response("Chat not found", { status: 404 });
  }

  const { plan } = await getCustomerSubscriptionStatus();

  if (messagesSentToday >= MAX_MESSAGES_PER_DAY && plan === "hobby") {
    return new Response(
      "You have reached the limit of free messages today. Subscribe to continue.",
      { status: 400 },
    );
  }

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: chat.messages as Message[],
    message,
  });

  const startTime = Date.now();

  const registry = await createUserProviderRegistry(chat.userId);

  const result = streamText({
    model: registry.languageModel(modelTag),
    experimental_generateMessageId: createIdGenerator({
      prefix: "msgs",
      size: 16,
    }),
    system: "You are a helpful assistant.",
    messages,
    async onFinish({ response, usage }) {
      // Add model information to the response messages
      const messagesWithModel = response.messages.map((msg) => ({
        ...msg,
        modelTag,
      }));
      await saveChat(
        id,
        modelTag,
        appendResponseMessages({
          messages: messages.slice(-1),
          responseMessages: messagesWithModel,
        }),
        usage,
        startTime,
      );
    },
    onError(error) {
      console.error(error);
    },
  });

  // consume the stream to avoid losing the response when client disconnects
  result.consumeStream();

  return result.toDataStreamResponse({
    headers: {
      "x-itzam-messages-sent-today": (messagesSentToday + 1).toString(),
    },
    sendReasoning: true,
    sendSources: true,
  });
}
