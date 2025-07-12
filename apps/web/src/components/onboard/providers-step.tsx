import { Provider } from "@itzam/server/db/provider/actions";
import { useState } from "react";
import { Button } from "../ui/button";
import { Check, ExternalLink, Save } from "lucide-react";
import { cn } from "~/lib/utils";
import ProviderIcon from "public/models/svgs/provider-icon";
import Link from "next/link";
import { Input } from "../ui/input";
import { ArrowRight } from "lucide-react";
import { providersApiKeyLinksAndPlaceholders } from "../providers/providers";
import {
  createProviderKey,
  ProviderKey as ProviderKeyType,
} from "@itzam/server/db/provider-keys/actions";
import { markUserAsOnboarded } from "@itzam/server/db/auth/actions";

export const ProvidersStep = ({
  handleNextStep,
  providers,
  providerKeys,
}: {
  handleNextStep: () => void;
  providers: Provider[];
  providerKeys: ProviderKeyType[];
}) => {
  const [createdAnyKey, setCreatedAnyKey] = useState(false);

  return (
    <div className="max-w-xl w-full">
      <h2 className="text-lg font-medium flex items-center gap-2">Providers</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Add API Keys to enable the providers you want to use.
      </p>

      <div className="flex flex-col gap-8 mt-8">
        {providers.map((provider) => (
          <ProviderKey
            key={provider.id}
            provider={provider}
            providerKey={providerKeys.find(
              (key) => key.providerId === provider.id,
            )}
            setCreatedAnyKey={setCreatedAnyKey}
          />
        ))}
      </div>

      <div className="flex justify-between mt-12 items-center">
        <p className="text-muted-foreground/60 text-xs">
          You can always enable providers later in the dashboard.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="w-20"
          disabled={!createdAnyKey && providerKeys.length === 0}
          onClick={async () => {
            await markUserAsOnboarded();
            handleNextStep();
          }}
        >
          Next
          <ArrowRight className="size-3" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
};

const ProviderKey = ({
  provider,
  providerKey,
  setCreatedAnyKey,
}: {
  provider: Provider;
  providerKey: ProviderKeyType | undefined;
  setCreatedAnyKey: (created: boolean) => void;
}) => {
  const [error, setError] = useState<boolean>(false);
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false);
  const [isKeySaved, setIsKeySaved] = useState<boolean>(
    !!providerKey?.secretName,
  );
  const [key, setKey] = useState(
    providerKey?.secretName ? "• • • • • • • • • • • • • • • • " : "",
  );

  const handleHideKey = async () => {
    setKey("• • • • • • • • • • • • • • • • ");
  };

  const handleCreateKey = async () => {
    if (key) {
      setIsCreatingKey(true);
      await createProviderKey(provider.id, key);
      setIsCreatingKey(false);
      setIsKeySaved(true);
      setCreatedAnyKey(true);
    }
  };

  return (
    <div key={provider.id} className="w-full">
      <div className="flex items-center gap-1.5 ml-1 mb-2">
        <ProviderIcon id={provider.id} size="xs" />
        <h3 className="font-medium text-sm ">{provider.name}</h3>
        <Link
          href={
            providersApiKeyLinksAndPlaceholders[
              provider.id as keyof typeof providersApiKeyLinksAndPlaceholders
            ].link || ""
          }
          target="_blank"
        >
          <ExternalLink
            className="ml-1 size-3 text-muted-foreground hover:text-foreground transition-all duration-200"
            strokeWidth={2.5}
          />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={key}
          onChange={(e) => {
            if (!isKeySaved) {
              setKey(e.target.value);
            }
          }}
          className={cn(
            "w-full font-mono text-xs",
            error ? "ring-1 ring-red-500" : "",
          )}
          placeholder={
            error
              ? "Invalid key"
              : providersApiKeyLinksAndPlaceholders[
                  provider.id as keyof typeof providersApiKeyLinksAndPlaceholders
                ].placeholder
          }
          style={{
            fontSize: "12px",
          }}
          disabled={isCreatingKey}
        />

        {!isKeySaved ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isCreatingKey}
            onClick={async () => {
              if (!key) {
                setError(true);
                setTimeout(() => {
                  setError(false);
                }, 3000);
                return;
              }

              await handleCreateKey();

              handleHideKey();
            }}
          >
            <div className="flex items-center gap-1">
              <Save className="size-3" strokeWidth={2.5} />
              <span>Save</span>
            </div>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <div className="flex items-center gap-1">
              <Check className="size-3" strokeWidth={2.5} />
              <span>Saved</span>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
};
