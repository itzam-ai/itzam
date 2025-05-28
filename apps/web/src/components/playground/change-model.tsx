"use client";

import {
  recommendedAccurateModel,
  recommendedCheapAndFastModel,
  recommendedGoodBalanceModel,
} from "@itzam/server/ai/recommended-models";
import { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { Pencil } from "lucide-react";
import ProviderIcon from "public/models/svgs/provider-icon";
import { useState } from "react";
import { FeaturedModel } from "../model/featured-model";
import { ModelDetails } from "../model/model-details";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { groupModelsByProviderAndSort } from "~/lib/providers";

export default function ChangeModel({
  models,
  setModel,
}: {
  models: ModelWithCostAndProvider[];
  setModel: (model: ModelWithCostAndProvider) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<ModelWithCostAndProvider | null>(null);

  const featuredModels = models.filter(
    (m) =>
      m.tag === recommendedCheapAndFastModel ||
      m.tag === recommendedAccurateModel ||
      m.tag === recommendedGoodBalanceModel
  );

  const sortedModels = groupModelsByProviderAndSort(models);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6">
          <Pencil className="size-2.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="!outline-none !focus:outline-none !focus:ring-0 sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Most Popular</DialogTitle>
        </DialogHeader>
        {featuredModels.length > 0 && (
          <div className="flex w-full items-center gap-3">
            {featuredModels.map((m) => (
              <FeaturedModel
                key={m.id}
                model={m}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
              />
            ))}
          </div>
        )}

        <ScrollArea className="mt-4 h-[450px] pr-4 rounded-md relative overflow-y-auto">
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-b from-transparent to-background/50 rounded-md z-10 pointer-events-none" />

          <div className="space-y-5">
            {sortedModels.map(({ providerName, models }) => (
              <div key={providerName}>
                <h4 className="mb-3 ml-2 flex items-center gap-1.5 font-medium text-sm">
                  <ProviderIcon id={models[0]?.providerId ?? ""} size="sm" />
                  {providerName}
                </h4>
                <div className="flex flex-wrap gap-3">
                  {models.map((m) => (
                    <ModelDetails
                      key={m.id}
                      model={m}
                      selectedModelId={selectedModel?.id ?? ""}
                      setSelectedModelId={(id) => {
                        setSelectedModel(
                          models.find((m) => m.id === id) ?? null
                        );
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (selectedModel) {
                setModel(selectedModel);
                setOpen(false);
              }
            }}
          >
            Change
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
