"use server";

import { LanguageModelUsage, Message } from "ai";
import { endOfToday, startOfToday } from "date-fns";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 } from "uuid";
import { db } from "..";
import { generateTitle } from "../../itzam/chat-title-generator";
import { getUser } from "../auth/actions";
import { calculateInputCost, calculateOutputCost } from "../run/utils";
import { chatMessages, chats, messageFiles, models } from "../schema";

const DEFAULT_MODEL = "google:gemini-2.0-flash";
export const createChat = async () => {
  const id = `chat_${v4()}`;

  const user = await getUser();

  if (user.error || !user.data.user) {
    redirect("/login");
  }

  const model = await db.query.models.findFirst({
    where: eq(models.tag, DEFAULT_MODEL),
  });

  if (!model) {
    throw new Error("Model not found");
  }

  await db.insert(chats).values({
    id,
    userId: user.data.user?.id ?? "",
    lastModelId: model.id,
    lastModelTag: model.tag,
  });

  redirect(`/chat/${id}`);
};

export type ChatWithMessages = Awaited<ReturnType<typeof getChatById>>;

export const getChatById = async (id: string) => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    redirect("/login");
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, id), eq(chats.userId, user.data.user.id)),
    with: {
      messages: {
        orderBy: [asc(chatMessages.createdAt), asc(chatMessages.role)],
        with: {
          files: true,
        },
      },
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  // map message files to experimental_attachments
  const messagesWithAttachments = chat.messages.map((message) => {
    return {
      ...message,
      experimental_attachments: message.files.map((file) => ({
        ...file,
      })),
    };
  });

  return {
    ...chat,
    messages: messagesWithAttachments,
  };
};

export type OlderChat = Awaited<ReturnType<typeof getOlderChats>>[number];

export const getOlderChats = async () => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    redirect("/login");
  }

  const olderChats = await db.query.chats.findMany({
    where: eq(chats.userId, user.data.user.id),
    columns: {
      id: true,
      updatedAt: true,
      title: true,
      lastModelTag: true,
    },
    with: {
      lastModel: true,
    },
    orderBy: [desc(chats.updatedAt)],
  });

  return olderChats;
};

export const getLastChat = async () => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    redirect("/login");
  }

  const lastChat = await db.query.chats.findFirst({
    where: eq(chats.userId, user.data.user.id),
    orderBy: [desc(chats.updatedAt)],
    with: {
      messages: {
        orderBy: [asc(chatMessages.createdAt), asc(chatMessages.role)],
      },
    },
  });

  return lastChat;
};

export const saveChat = async (
  id: string,
  modelTag: string,
  messages: Message[],
  usage: LanguageModelUsage,
  startTime: number
) => {
  const model = await db.query.models.findFirst({
    where: eq(models.tag, modelTag),
  });

  if (!model) {
    throw new Error("Model not found");
  }

  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, id),
    with: {
      messages: true,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  const userMessage = messages.find((message) => message.role === "user");

  // check if the user message is already in the database (meaning the user reloaded)
  const oldUserMessage = await db.query.chatMessages.findFirst({
    where: and(
      eq(chatMessages.chatId, id),
      eq(chatMessages.id, userMessage?.id ?? ""),
      eq(chatMessages.role, "user")
    ),
  });

  // if it is, delete the user and assistant messages and the files as the new one will be saved
  // (in the future, we should save both versions like OpenAI)
  if (oldUserMessage) {
    // delete the user message files
    await db
      .delete(messageFiles)
      .where(eq(messageFiles.messageId, oldUserMessage.id));

    // delete the user message
    await db.delete(chatMessages).where(eq(chatMessages.id, oldUserMessage.id));

    const oldAssistantMessage = await db.query.chatMessages.findFirst({
      where: and(
        eq(chatMessages.chatId, id),
        eq(chatMessages.role, "assistant")
      ),
      orderBy: [desc(chatMessages.updatedAt)],
    });

    // delete the assistant message
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.id, oldAssistantMessage?.id ?? ""));
  }

  const totalTokensInContext = chat.messages.reduce((acc, message) => {
    return acc + message.tokensUsed;
  }, 0);

  // insert messages
  await db.insert(chatMessages).values(
    messages.map((message) => ({
      id: message.id,
      chatId: id,
      modelId: model.id,
      modelTag: modelTag,
      modelName: model.name,
      role: message.role as "user" | "assistant" | "system" | "data",
      content: message.content,
      reasoning: message.parts?.find((part) => part.type === "reasoning")
        ?.reasoning,
      cost:
        message.role === "user"
          ? calculateInputCost(
              model.inputPerMillionTokenCost ?? "0",
              usage.promptTokens
            ).toString()
          : calculateOutputCost(
              model.outputPerMillionTokenCost ?? "0",
              usage.completionTokens
            ).toString(),
      // tokens used is the total tokens used ONLY for the message (i.e for user messages we exclude the tokens used for the context)
      tokensUsed:
        message.role === "user"
          ? usage.promptTokens - totalTokensInContext
          : usage.completionTokens,
      // tokens with context is the total tokens used for the context (i.e for user messages we include the tokens used for the context)
      tokensWithContext: message.role === "user" ? usage.promptTokens : 0,
      durationInMs: message.role === "user" ? null : Date.now() - startTime,
    }))
  );

  // insert files
  const files = messages.flatMap(
    (message) =>
      message.experimental_attachments?.map((attachment) => ({
        id: `file_${v4()}`,
        url: attachment.url,
        name: attachment.name,
        contentType: attachment.contentType,
        messageId: message.id,
      })) ?? []
  );

  if (files.length > 0) {
    await db.insert(messageFiles).values(files);
  }

  // update chat model
  await db
    .update(chats)
    .set({ lastModelTag: modelTag, lastModelId: model.id })
    .where(eq(chats.id, id));

  // update chat title
  if (!chat.title) {
    try {
      const title = await generateTitle(messages);

      await db.update(chats).set({ title }).where(eq(chats.id, id));
    } catch (error) {
      console.error(`Error generating title for chat ${id}: ${error}`);
    }
  }
};

export const updateChatTitle = async (id: string, title: string) => {
  await db.update(chats).set({ title }).where(eq(chats.id, id));

  revalidatePath(`/chat/${id}`);
};

export const deleteChat = async (id: string) => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    redirect("/login");
  }

  await db.delete(chatMessages).where(eq(chatMessages.chatId, id));

  await db.delete(chats).where(eq(chats.id, id));

  const lastChat = await db.query.chats.findFirst({
    where: eq(chats.userId, user.data.user.id),
    orderBy: [desc(chats.updatedAt)],
  });

  redirect(`/chat/${lastChat?.id}`);
};

export const getChatMetadata = async (id: string) => {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, id),
    with: {
      messages: true,
    },
  });

  if (!chat) {
    throw new Error("Chat not found");
  }

  const tokensUsed = chat.messages.reduce((acc, message) => {
    return acc + message.tokensUsed;
  }, 0);

  const cost = chat.messages.reduce((acc, message) => {
    return acc + parseFloat(message.cost ?? "0");
  }, 0);

  const totalMessages = chat.messages.length;

  return {
    tokensUsed,
    cost,
    totalMessages,
  };
};

export const howManyMessagesSentToday = async () => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    redirect("/login");
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const messages = await db.query.chats.findMany({
    where: eq(chats.userId, user.data.user.id),
    with: {
      messages: {
        where: and(
          eq(chatMessages.role, "user"),
          gt(chatMessages.createdAt, todayStart),
          lt(chatMessages.createdAt, todayEnd)
        ),
      },
    },
  });

  const totalMessages = messages.reduce(
    (acc, chat) => acc + chat.messages.length,
    0
  );

  return totalMessages;
};
