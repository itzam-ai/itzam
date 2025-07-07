import { getUser } from "@itzam/server/db/auth/actions";
import { sendDiscordNotification } from "@itzam/server/discord/actions";
import { syncStripeDataToDB } from "@itzam/server/stripe/stripe";
import { redirect } from "next/navigation";

export async function GET() {
  const user = await getUser();

  const stripeCustomerId = user.data.user?.user_metadata.stripeCustomerId;

  await sendDiscordNotification({
    content: `💰 **NEW PURCHASE:**\n${stripeCustomerId} - ${user.data.user?.user_metadata.name} - ${user.data.user?.user_metadata.email}`,
  });

  if (!stripeCustomerId) {
    return redirect("/");
  }

  await syncStripeDataToDB(stripeCustomerId);
  return redirect("/dashboard/settings");
}
