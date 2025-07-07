"use server";

import Itzam from "itzam";
import { env } from "@itzam/utils";
import { getUser } from "../db/auth/actions";
import { createAdminAuthClient } from "../db/supabase/server";
import { getCustomerSubscriptionStatus } from "../db/billing/actions";

const itzam = new Itzam(env.ITZAM_API_KEY);

export async function enhancePrompt(currentPrompt: string) {
  const user = await getUser();

  if (user.error || !user.data.user?.id) {
    return { error: "Failed to get user" };
  }

  const { plan } = await getCustomerSubscriptionStatus();
  const enhancePromptCount =
    user.data.user?.user_metadata?.enhance_prompt_count ?? 0;
  const enhancePromptLimit = plan === "pro" ? 100 : plan === "basic" ? 10 : 0;
  const isEnhancePromptLimitReached = enhancePromptCount >= enhancePromptLimit;

  if (isEnhancePromptLimitReached) {
    return {
      error: "Enhance prompt limit reached",
      description:
        "You have reached the enhance prompt limit. Upgrade for more.",
    };
  }

  try {
    const response = await itzam.streamText({
      input: `
      Current prompt: ${currentPrompt}
      `,
      workflowSlug: "prompt-enhancer",
    });

    void increaseEnhancePromptCount();

    return response;
  } catch (error) {
    console.error(error);
    return { error: "Failed to enhance prompt" };
  }
}

const increaseEnhancePromptCount = async () => {
  const user = await getUser();

  if (user.error || !user.data.user?.id) {
    return { error: "Failed to get user" };
  }

  const adminClient = await createAdminAuthClient();

  await adminClient.updateUserById(user.data.user?.id, {
    user_metadata: {
      enhance_prompt_count:
        (user.data.user?.user_metadata?.enhance_prompt_count ?? 0) + 1,
    },
  });
};
