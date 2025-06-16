"use server";

import { env } from "@itzam/utils";
import { cache } from "react";
import { sendDiscordNotification } from "../../discord/actions";
import {
  getStripeData,
  getStripeDataForUserId,
  stripe,
} from "../../stripe/stripe";
import { getUser } from "../auth/actions";

// ---------------------------- STRIPE ----------------------------

export const createStripeCustomer = async (
  userId: string,
  name: string,
  email: string
) => {
  const stripeCustomer = await stripe.customers.create({
    name,
    email,
    metadata: {
      userId,
    },
  });

  await sendDiscordNotification({
    content: `💰 **NEW STRIPE CUSTOMER:**\n${stripeCustomer.id} - ${name} - ${email}`,
  });

  return stripeCustomer;
};

export const getCurrentUserStripeCustomerId = cache(async () => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Failed to get user" };
  }

  if (!user.data.user?.user_metadata.stripeCustomerId) {
    return { error: "User has no Stripe customer ID" };
  }

  return { data: String(user.data.user?.user_metadata.stripeCustomerId) };
});

export const customerIsSubscribedToItzamPro = cache(async () => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    throw new Error("Failed to get user");
  }

  if (!user.data.user.user_metadata.stripeCustomerId) {
    throw new Error("User has no Stripe customer ID");
  }

  const stripeData = await getStripeData();

  if ("error" in stripeData) {
    return {
      isSubscribed: false,
      priceId: null,
    };
  }

  if (stripeData.status === "none") {
    return {
      isSubscribed: false,
      priceId: null,
    };
  }

  return {
    isSubscribed: stripeData.status === "active",
    priceId: stripeData.priceId,
  };
});

export const customerIsSubscribedToItzamProForUserId = cache(
  async (userId: string) => {
    const stripeData = await getStripeDataForUserId(userId);

    if ("error" in stripeData) {
      return {
        isSubscribed: false,
        priceId: null,
      };
    }

    if (stripeData.status === "none") {
      return {
        isSubscribed: false,
        priceId: null,
      };
    }

    return {
      isSubscribed: stripeData.status === "active",
      priceId: stripeData.priceId,
    };
  }
);

export const getItzamProProduct = cache(async () => {
  try {
    const product = await stripe.products.retrieve(
      env.STRIPE_ITZAM_PRO_PRODUCT_ID
    );

    return product;
  } catch (error) {
    console.error(error);
    return { error: "Failed to get Itzam Pro product" };
  }
});

export const createCheckoutSession = async (priceId: string) => {
  const user = await getUser();

  if (user.error || !user.data.user) {
    return { error: "Failed to get user" };
  }

  const session = await stripe.checkout.sessions.create({
    customer: user.data.user.user_metadata.stripeCustomerId ?? undefined,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    metadata: {
      userId: user.data.user.id,
    },
  });

  return session;
};
