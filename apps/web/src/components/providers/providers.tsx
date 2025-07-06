"use client";

import {
  createProviderKey,
  deleteProviderKey,
  getProviderKey,
  updateProviderKey,
  type ProviderKey,
} from "@itzam/server/db/provider-keys/actions";
import { Provider } from "@itzam/server/db/provider/actions";
import { ExternalLink, Pencil, Save, Trash } from "lucide-react";
import Link from "next/link";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
export const providersApiKeyLinksAndPlaceholders = {
  openai: {
    link: "https://platform.openai.com/account/api-keys",
    placeholder: "sk_proj3123_g1v3f33db4ck",
  },
  anthropic: {
    link: "https://console.anthropic.com/account/keys",
    placeholder: "sk-ant-api03-BNs9NxUEfBak",
  },
  google: {
    link: "https://makersuite.google.com/app/apikey",
    placeholder: "AIzaSyB1v3f33db4ck",
  },
  deepseek: {
    link: "https://platform.deepseek.com/api_keys",
    placeholder: "sk-51a9e16c7b1641",
  },
  xai: {
    link: "https://console.x.ai/",
    placeholder: "xai-76fgdsufv7gfds",
  },
  cohere: {
    link: "https://dashboard.cohere.ai/api-keys",
    placeholder: "rvGd6mSbT5HmrawiHc",
  },
  mistral: {
    link: "https://console.mistral.ai/api-keys",
    placeholder: "WafUFkbCws9gyWIwSI",
  },
};

export function Providers({
  providers,
  providerKeys,
}: {
  providers: Provider[];
  providerKeys: ProviderKey[];
}) {
  return (
    <div className="flex flex-col gap-8">
      {providers.map((provider) => (
        <ProviderKey
          key={provider.id}
          provider={provider}
          providerKey={
            providerKeys.find((key) => key.providerId === provider.id) || null
          }
        />
      ))}
    </div>
  );
}

const hiddenKey = "• • • • • • • • • • • • • • • • ";

const ProviderKey = ({
  provider,
  providerKey,
}: {
  provider: Provider;
  providerKey: ProviderKey | null;
}) => {
  const hasKey = !!providerKey;

  const [error, setError] = useState<boolean>(false);
  const [key, setKey] = useState(hasKey ? hiddenKey : null);
  const [isEditing, setIsEditing] = useState(!hasKey);
  const [isGettingKey, setIsGettingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);
  const [open, setOpen] = useState(false);

  const handleShowKey = async () => {
    setIsGettingKey(true);

    const secret = await getProviderKey(provider.id);
    setKey(secret);

    setIsGettingKey(false);
  };

  const handleHideKey = async () => {
    setKey(hiddenKey);
  };

  const handleUpdateKey = async () => {
    if (key) {
      await updateProviderKey(provider.id, key);
      toast.success(`${provider.name} key updated`);
    }
  };

  const handleCreateKey = async () => {
    if (key) {
      await createProviderKey(provider.id, key);
      toast.success(`${provider.name} key created`);
    }
  };

  const providerDetails =
    providersApiKeyLinksAndPlaceholders[
      provider.id as keyof typeof providersApiKeyLinksAndPlaceholders
    ];

  const handleDeleteKey = async () => {
    setIsDeletingKey(true);
    await deleteProviderKey(provider.id);
    setOpen(false);
    toast.success(`${provider.name} key deleted`);
    setKey(null);
    setIsDeletingKey(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 ml-1 mb-3">
        <ProviderIcon id={provider.id} size="xs" />
        <h3 className="font-medium text-sm ">{provider.name}</h3>
        <Link href={providerDetails?.link || ""} target="_blank">
          <ExternalLink
            className="ml-1 size-3 text-muted-foreground hover:text-foreground transition-all duration-200"
            strokeWidth={2.5}
          />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={key || ""}
          onChange={(e) => {
            if (key === hiddenKey) {
              return;
            }
            setKey(e.target.value);
          }}
          className={cn(
            "w-[calc(100%-20rem)] font-mono text-xs ",
            error ? "ring-1 ring-red-500" : ""
          )}
          placeholder={providerDetails?.placeholder || ""}
          style={{
            fontSize: "12px",
          }}
          disabled={isGettingKey}
        />

        <Button
          variant="secondary"
          size={isEditing || !hasKey ? "sm" : "icon"}
          disabled={isGettingKey}
          onClick={async () => {
            // CREATE OR UPDATE
            if (isEditing) {
              // ERROR IF NO KEY
              if (!key) {
                toast.error(`${provider.name} key is required`);
                setError(true);
                setTimeout(() => {
                  setError(false);
                }, 3000);
                return;
              }

              // CREATE
              if (!hasKey) {
                await handleCreateKey();
                // UPDATE
              } else {
                await handleUpdateKey();
              }

              handleHideKey();
              setIsEditing(false);
            } else {
              await handleShowKey();
              setIsEditing(true);
            }
          }}
        >
          {isEditing || !hasKey ? (
            <div className="flex items-center gap-1">
              <Save className="size-3" strokeWidth={2.5} />
              <span>Save</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Pencil className="size-3" strokeWidth={2.5} />
            </div>
          )}
        </Button>
        {hasKey && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" disabled={isDeletingKey}>
                <Trash className="size-3" strokeWidth={2.5} />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="!focus:outline-none !focus:ring-0 sm:max-w-[400px]"
              style={{ outline: "none" }}
              tabIndex={-1}
            >
              <DialogHeader>
                <DialogTitle>Delete Provider Key</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this provider key? This will
                  make workflows that use this provider stop working.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  size="sm"
                  disabled={isDeletingKey}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteKey}
                  disabled={isDeletingKey}
                  size="sm"
                  className="w-20"
                >
                  {isDeletingKey ? <Spinner /> : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
