import { ModelWithProvider } from "@itzam/server/db/model/actions";
import { Provider } from "@itzam/server/db/provider/actions";

export const providersIdSortingOrder = [
  "openai",
  "anthropic",
  "google",
  "xai",
  "deepseek",
  "mistral",
  "cohere",
];

export const sortProviders = (providers: Provider[]) => {
  return providers.sort((a, b) => {
    const indexA = providersIdSortingOrder.indexOf(a.id);
    const indexB = providersIdSortingOrder.indexOf(b.id);
    return indexA - indexB;
  });
};

export const groupModelsByProviderAndSort = (models: ModelWithProvider[]) => {
  // Group models by provider
  const modelsByProvider = models.reduce<Record<string, ModelWithProvider[]>>(
    (acc, model) => {
      const providerName = model.provider?.name || "Unknown Provider";
      if (!acc[providerName]) {
        acc[providerName] = [];
      }
      acc[providerName].push(model);
      return acc;
    },
    {},
  );

  // Sort providers based on providersIdSortingOrder
  const sortedProviderEntries = Object.entries(modelsByProvider).sort(
    ([providerNameA, modelsA], [providerNameB, modelsB]) => {
      const providerIdA = modelsA[0]?.providerId;
      const providerIdB = modelsB[0]?.providerId;

      const indexA = providersIdSortingOrder.indexOf(providerIdA ?? "");
      const indexB = providersIdSortingOrder.indexOf(providerIdB ?? "");

      // If both providers are in the sorting order, use their indices
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one provider is in the sorting order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // For providers not in the sorting order, maintain alphabetical order
      return providerNameA.localeCompare(providerNameB);
    },
  );

  return sortedProviderEntries.map(([providerName, models]) => ({
    providerName,
    models,
  }));
};
