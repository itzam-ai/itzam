import { ApiKey } from "@itzam/server/db/api-keys/actions";
import { formatDistanceToNow } from "date-fns";
import { Lock, Trash } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import EmptyStateDetails from "../empty-state/empty-state-detais";
import { DeleteApiKeyDialog } from "./delete-api-key-dialog";

export function ApiKeysTable({ apiKeys }: { apiKeys: ApiKey[] | undefined }) {
  return (
    <div>
      {!apiKeys?.length ? (
        <div className="rounded-lg border">
          <EmptyStateDetails
            title="No API keys yet"
            description="Create a key to start using the API / SDKs"
            icon={<Lock />}
            className="py-24"
          />
        </div>
      ) : (
        <Table>
          <TableHeader className="rounded-lg">
            <TableRow className="border-none hover:bg-transparent ">
              <TableHead className="rounded-tl-lg rounded-bl-lg pl-4 ">
                Name
              </TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="rounded-tr-lg rounded-br-lg"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id} className="hover:bg-transparent">
                <TableCell className="min-w-[140px] truncate pl-4">
                  {apiKey.name}
                </TableCell>

                <TableCell className="min-w-[180px] truncate">
                  {apiKey.lastUsedAt
                    ? formatDistanceToNow(apiKey.lastUsedAt, {
                        addSuffix: true,
                      })
                    : "Never"}
                </TableCell>

                <TableCell className="min-w-[200px] truncate text-muted-foreground">
                  {apiKey.shortKey}...
                </TableCell>
                <TableCell className="min-w-[60px]">
                  <DeleteApiKeyDialog id={apiKey.id}>
                    <Button variant="ghost" size="icon">
                      <Trash className="size-4" />
                    </Button>
                  </DeleteApiKeyDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
