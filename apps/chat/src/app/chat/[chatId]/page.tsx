import { getCustomerSubscriptionStatus } from "@itzam/server/db/billing/actions";
import {
  createChat,
  getChatById,
  getLastChat,
  getOlderChats,
  howManyMessagesSentToday,
} from "@itzam/server/db/chat/actions";
import { getAvailableModelsWithCost } from "@itzam/server/db/model/actions";
import Image from "next/image";
import { redirect } from "next/navigation";
import Chat from "~/components/chat/chat";
import { ChatStats } from "~/components/chat/chat-stats";
import { ChatTitle } from "~/components/chat/chat-title";
import { UserMenu } from "~/components/user-menu";
import { groupModelsByProviderAndSort } from "~/lib/providers";
export default async function Page(props: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await props.params;

  if (!chatId) {
    const lastChat = await getLastChat();

    if (lastChat) {
      redirect(`/chat/${lastChat.id}`);
    }

    await createChat();
    return;
  }

  const chat = await getChatById(chatId);

  if (!chat || "error" in chat) {
    return <div>Chat not found</div>;
  }

  const models = await getAvailableModelsWithCost();
  const sortedModels = groupModelsByProviderAndSort(models);
  const sortedModelsFlat = sortedModels.flatMap((provider) => provider.models);

  const olderChats = await getOlderChats();

  const { plan } = await getCustomerSubscriptionStatus();
  const messagesSentToday = await howManyMessagesSentToday();

  return (
    <div className="flex flex-col h-screen w-full relative">
      <div className="absolute md:top-12 md:left-12 top-6 left-6 z-10 bg-background">
        <div className="flex items-center gap-4 mb-8">
          <Image src="/logo.svg" alt="Logo" width={20} height={20} />
          {chat.title && <ChatTitle title={chat.title} />}
        </div>
        <ChatStats chatId={chatId} />
      </div>

      <div className="absolute md:top-12 md:right-12 top-6 right-6 z-10 bg-background">
        <UserMenu
          olderChats={olderChats}
          chatId={chatId}
          hasActiveSubscription={plan === "pro"}
        />
      </div>
      <Chat
        chat={chat}
        models={sortedModelsFlat}
        hasActiveSubscription={plan === "pro"}
        messagesSentToday={messagesSentToday}
      />
    </div>
  );
}
