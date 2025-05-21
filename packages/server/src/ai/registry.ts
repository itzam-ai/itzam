import { createAnthropic } from "@ai-sdk/anthropic";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { experimental_createProviderRegistry as createProviderRegistry } from "ai";
import { getSecret } from "../db/supabase/vault";
export async function createUserProviderRegistry(userId: string) {
  const [
    openaiKey,
    anthropicKey,
    cohereKey,
    xaiKey,
    googleKey,
    mistralKey,
    deepseekKey,
  ] = await Promise.all([
    getSecret(`${userId}_openai`),
    getSecret(`${userId}_anthropic`),
    getSecret(`${userId}_cohere`),
    getSecret(`${userId}_xai`),
    getSecret(`${userId}_google`),
    getSecret(`${userId}_mistral`),
    getSecret(`${userId}_deepseek`),
  ]);

  return createProviderRegistry({
    openai: createOpenAI({ apiKey: openaiKey, compatibility: "strict" }),
    anthropic: createAnthropic({ apiKey: anthropicKey }),
    cohere: createCohere({ apiKey: cohereKey }),
    xai: createXai({ apiKey: xaiKey }),
    google: createGoogleGenerativeAI({ apiKey: googleKey }),
    mistral: createMistral({ apiKey: mistralKey }),
    deepseek: createDeepSeek({ apiKey: deepseekKey }),
  });
}
