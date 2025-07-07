import { env } from "@itzam/utils/env";
import Stripe from "stripe";
import { getUser } from "../db/auth/actions";
import { createAdminAuthClient } from "../db/supabase/server";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export type STRIPE_DATA =
  | {
      subscriptionId: string | null;
      status: Stripe.Subscription.Status;
      priceId: string | null;
      productId: string | null;
      plan: "hobby" | "basic" | "pro";
      currentPeriodStart: number | null;
      currentPeriodEnd: number | null;
      cancelAtPeriodEnd: boolean;
      paymentMethod: {
        brand: string | null; // e.g., "visa", "mastercard"
        last4: string | null; // e.g., "4242"
      } | null;
    }
  | {
      status: "none";
      plan: "hobby";
    };

export async function createCheckoutSession(stripeCustomerId: string) {
  // ALWAYS create a checkout with a stripeCustomerId. They should enforce this.
  const checkout = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    success_url: `${env.NEXT_PUBLIC_APP_URL}/api/stripe/success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return checkout;
}

export async function syncStripeDataToDB(customerId: string) {
  // Fetch latest subscription data from Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: "all",
    expand: ["data.default_payment_method"],
  });

  if (subscriptions.data.length === 0) {
    const subData = { status: "none", plan: "hobby" };
    await updateStripeData(customerId, subData);
    return subData;
  }

  // If a user can have multiple subscriptions, that's your problem
  const subscription = subscriptions.data[0];

  if (!subscription) {
    console.log("No subscription found");
    return { error: "No subscription found" };
  }

  const itzamBasicProductId = env.STRIPE_ITZAM_BASIC_PRODUCT_ID;
  const itzamProProductId = env.STRIPE_ITZAM_PRO_PRODUCT_ID;

  const productId = subscription.items.data[0]?.price.product;

  // Store complete subscription state
  const subData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    productId,
    plan:
      productId === itzamBasicProductId
        ? "basic"
        : productId === itzamProProductId
          ? "pro"
          : "hobby",
    priceId: subscription.items.data[0]?.price.id,
    currentPeriodEnd: subscription.current_period_end,
    currentPeriodStart: subscription.current_period_start,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    paymentMethod:
      subscription.default_payment_method &&
      typeof subscription.default_payment_method !== "string"
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  };

  await updateStripeData(customerId, subData);
  return subData;
}

export async function updateStripeData(customerId: string, subData: any) {
  const supabaseAdmin = await createAdminAuthClient();

  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) {
    console.log("This customer has been deleted");
    return null;
  }

  const userId = customer.metadata.userId;

  if (!userId) {
    console.log("No user ID found");
    return null;
  }

  await supabaseAdmin.updateUserById(userId, {
    user_metadata: { stripeData: subData },
  });

  return subData;
}

export async function getStripeData() {
  const supabaseAdmin = await createAdminAuthClient();

  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Unauthorized" };
  }

  const userId = user.data.user.id;

  const userData = await supabaseAdmin.getUserById(userId);

  if (userData.error || !userData.data.user) {
    return { error: "Unauthorized" };
  }

  const stripeData = userData.data.user.user_metadata.stripeData;

  if (!stripeData) {
    return { error: "No stripe data found" };
  }

  return stripeData as STRIPE_DATA;
}

export async function getStripeDataForUserId(userId: string) {
  const supabaseAdmin = await createAdminAuthClient();

  const userData = await supabaseAdmin.getUserById(userId);

  if (userData.error || !userData.data.user) {
    return { error: "Unauthorized" };
  }

  const stripeData = userData.data.user.user_metadata.stripeData;

  if (!stripeData) {
    return { error: "No stripe data found" };
  }

  return stripeData as STRIPE_DATA;
}
