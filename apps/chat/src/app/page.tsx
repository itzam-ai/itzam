import {
  createChat,
  getChatById,
  getLastChat,
} from "@itzam/server/db/chat/actions";
import { redirect } from "next/navigation";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  if (!id) {
    const lastChat = await getLastChat();

    if (lastChat) {
      redirect(`/chat/${lastChat.id}`);
    } else {
      await createChat();
    }
    return;
  }

  const chat = await getChatById(id);

  if (!chat || "error" in chat) {
    return <div>Chat not found</div>;
  }

  redirect(`/chat/${chat.id}`);
}
