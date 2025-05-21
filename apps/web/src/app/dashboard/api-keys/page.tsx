import { getUserApiKeys } from "@itzam/server/db/api-keys/actions";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import "server-only";
import { ApiKeysTable } from "~/components/api-keys/api-keys-table";
import { CreateApiKeyDialog } from "~/components/api-keys/create-api-key-dialog";
import { Button } from "~/components/ui/button";

export default async function ApiKeysPage() {
  const apiKeys = await getUserApiKeys();

  if ("error" in apiKeys) {
    return <div>{apiKeys.error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-xl tracking-tight">API Keys</h1>
          <p className="text-muted-foreground text-sm">Manage your API keys.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="https://docs.itz.am" target="_blank">
            <Button size="sm" variant="outline">
              <FileText className="size-3" strokeWidth={2.5} />
              Documentation
            </Button>
          </Link>
          <CreateApiKeyDialog>
            <Button size="sm" variant="primary">
              <Plus className="size-3" strokeWidth={2.5} />
              New API Key
            </Button>
          </CreateApiKeyDialog>
        </div>
      </div>
      <ApiKeysTable apiKeys={apiKeys} />
    </div>
  );
}
