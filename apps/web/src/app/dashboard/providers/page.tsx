import { getProviderKeys } from "@itzam/server/db/provider-keys/actions";
import { getProviders } from "@itzam/server/db/provider/actions";
import "server-only";
import { Providers } from "~/components/providers/providers";
import { sortProviders } from "~/lib/providers";

export default async function ProvidersPage() {
  const providers = await getProviders();
  const providerKeys = await getProviderKeys();

  const sortedProviders = sortProviders(providers);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-semibold text-xl">Providers</h1>
        <p className="text-muted-foreground text-sm">Manage your providers.</p>
      </div>

      <Providers providers={sortedProviders} providerKeys={providerKeys} />
    </div>
  );
}
