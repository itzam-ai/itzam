import { getAvailableModelsWithCost } from "@itzam/server/db/model/actions";
import { Brain, Code, Eye } from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { CreateModel } from "~/components/admin/create-model";
import { DeleteModel } from "~/components/admin/delete-model";
import { UpdateModel } from "~/components/admin/update-model";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import { groupModelsByProviderAndSort } from "~/lib/providers";

export default async function AdminModelsPage() {
  const models = await getAvailableModelsWithCost();

  const providers = models
    .filter((model) => model.provider !== null)
    .map((model) => model.provider)
    .filter(
      (provider, index, self) =>
        self.findIndex((p) => p?.id === provider?.id) === index
    );

  const sortedModels = groupModelsByProviderAndSort(models);

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="font-bold text-2xl">Models</h2>
        <CreateModel providers={providers} />
      </div>

      <div className="mt-8 space-y-12">
        {sortedModels.map(({ providerName, models }) => (
          <div key={providerName}>
            <h3 className="mb-3 ml-1 flex items-center gap-2 font-medium text-lg">
              <ProviderIcon id={models[0]?.providerId ?? ""} size="sm" />
              {providerName}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <Card key={model.id}>
                  <div className="flex flex-row justify-between p-6 pb-3">
                    <div className="flex flex-col gap-2">
                      <CardTitle>
                        <div className="flex items-center gap-2">
                          <ModelIcon tag={model.tag} size="xs" />
                          {model.name}
                        </div>
                      </CardTitle>
                      <CardDescription>{model.provider?.name}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <UpdateModel model={model} providers={providers} />
                      <DeleteModel modelId={model.id} />
                    </div>
                  </div>

                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <p className="text-muted-foreground text-xs">
                        Input Cost:{" "}
                        <span className="font-bold">
                          ${model.inputPerMillionTokenCost}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Output Cost:{" "}
                        <span className="font-bold">
                          ${model.outputPerMillionTokenCost}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Context Window:{" "}
                        <span className="font-bold">
                          {model.contextWindowSize}
                        </span>
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex gap-2">
                        {model.hasReasoningCapability && (
                          <Brain className="size-6 rounded-md bg-green-600/10 p-1 text-green-600" />
                        )}
                        {model.hasVision && (
                          <Eye className="size-6 rounded-md bg-sky-600/10 p-1 text-sky-600" />
                        )}
                        {model.isOpenSource && (
                          <Code className="size-6 rounded-md bg-orange-600/10 p-1 text-orange-600" />
                        )}
                      </div>
                      <div className="text-xs">
                        {model.deprecated ? (
                          <p className="rounded-md bg-red-600/10 px-2 py-1 text-red-600">
                            Deprecated
                          </p>
                        ) : (
                          <p className="rounded-md bg-green-600/10 px-2 py-1 text-green-600">
                            Active
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
