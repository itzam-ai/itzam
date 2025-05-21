import { getUser } from "@itzam/server/db/auth/actions";
import { syncStripeDataToDB } from "@itzam/server/stripe/stripe";
import { redirect } from "next/navigation";

export async function GET() {
  const user = await getUser();

  const stripeCustomerId = user.data.user?.user_metadata.stripeCustomerId;

  if (!stripeCustomerId) {
    return redirect("/");
  }

  await syncStripeDataToDB(stripeCustomerId);
  return redirect("/dashboard/settings");
}
