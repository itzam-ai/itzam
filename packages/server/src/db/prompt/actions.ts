"use server";
import { getUser } from "../auth/actions";
import { getCustomerSubscriptionStatus } from "../billing/actions";

export async function getEnhancePromptUsage() {
  const user = await getUser();

  const { plan } = await getCustomerSubscriptionStatus();
  const enhancePromptCount =
    user.data.user?.user_metadata?.enhance_prompt_count ?? 0;
  const enhancePromptLimit = plan === "pro" ? 100 : plan === "basic" ? 10 : 0;
  const isEnhancePromptLimitReached = enhancePromptCount >= enhancePromptLimit;

  return {
    enhancePromptCount,
    enhancePromptLimit,
    isEnhancePromptLimitReached,
  };
}
