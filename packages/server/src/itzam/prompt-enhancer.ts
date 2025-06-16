"use server";

import Itzam from "itzam";
import { env } from "@itzam/utils";
import { getUser } from "../db/auth/actions";
import { createAdminAuthClient } from "../db/supabase/server";
import { customerIsSubscribedToItzamPro } from "../db/billing/actions";

const itzam = new Itzam(env.ITZAM_API_KEY, {
  basePath: "http://localhost:3000",
});

export async function enhancePrompt(currentPrompt: string) {
  const user = await getUser();

  if (user.error || !user.data.user?.id) {
    return { error: "Failed to get user" };
  }

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();
  const enhancePromptCount =
    user.data.user?.user_metadata?.enhance_prompt_count ?? 0;
  const enhancePromptLimit = isSubscribedToItzamPro.isSubscribed ? 100 : 10;
  const isEnhancePromptLimitReached = enhancePromptCount >= enhancePromptLimit;

  if (isEnhancePromptLimitReached) {
    return {
      error: "Enhance prompt limit reached",
      description: isSubscribedToItzamPro.isSubscribed
        ? "You have reached the enhance prompt limit. Contact support (support@itz.am) to upgrade."
        : "Please upgrade to Itzam Pro to continue using this feature.",
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
