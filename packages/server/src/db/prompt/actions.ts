"use server";
import { db } from "..";
import { customerIsSubscribedToItzamPro } from "../billing/actions";
import { getUser } from "../auth/actions";

export async function getEnhancePromptUsage() {
  const user = await getUser();

  const isSubscribedToItzamPro = await customerIsSubscribedToItzamPro();
  const enhancePromptCount =
    user.data.user?.user_metadata?.enhance_prompt_count ?? 0;
  const enhancePromptLimit = isSubscribedToItzamPro.isSubscribed ? 100 : 10;
  const isEnhancePromptLimitReached = enhancePromptCount >= enhancePromptLimit;

  return {
    enhancePromptCount,
    enhancePromptLimit,
    isEnhancePromptLimitReached,
  };
}
