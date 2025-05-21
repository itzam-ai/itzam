import { getProviderKeys } from "@itzam/server/db/provider-keys/actions";
import { getProviders } from "@itzam/server/db/provider/actions";
import { Onboard } from "~/components/onboard/onboard";
import { sortProviders } from "~/lib/providers";

/*
  Onboarding page

  - User is redirected to this page after signing up
  - User can choose to skip onboarding (mark as onboarded in supabase auth metadata)

  - First step is to input provider keys
  - Second step is to input first workflow name and desc (we will generate a prompt based on this info) and then choose the model
  - Third step is to create an api key and show the user some code snippet to copy (maybe generate text) (maybe we can run his workflow with a simple input generated from AI)

  - After this we mark the user as onboarded in supabase auth metadata
  - We redirect to the workflows page
*/

export default async function OnboardPage() {
  const providers = await getProviders();
  const providerKeys = await getProviderKeys();

  const sortedProviders = sortProviders(providers);

  if (sortedProviders.length === 0) {
    return <div className="bg-sidebar min-h-screen dark:bg-card" />;
  }

  return <Onboard providers={sortedProviders} providerKeys={providerKeys} />;
}
