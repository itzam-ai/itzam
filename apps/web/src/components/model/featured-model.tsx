"use client";

import {
  recommendedAccurateModel,
  recommendedCheapAndFastModel,
  recommendedGoodBalanceModel,
} from "@itzam/server/ai/recommended-models";
import { ModelWithCostAndProvider } from "@itzam/server/db/model/actions";
import { CircleCheck, Rabbit, Scale } from "lucide-react";
import { useTheme } from "next-themes";
import ModelIcon from "public/models/svgs/model-icon";
import { Badge, BadgeProps } from "../ui/badge";
export function FeaturedModel({
  model,
  selectedModel,
  setSelectedModel,
}: {
  model: ModelWithCostAndProvider;
  selectedModel: ModelWithCostAndProvider | null;
  setSelectedModel: (model: ModelWithCostAndProvider) => void;
}) {
  const { resolvedTheme } = useTheme();

  const getFeaturedModelStyle = (tag: string) => {
    if (tag === recommendedCheapAndFastModel) {
      return {
        label: "Cheap & Fast",
        color: "emerald",
        icon: <Rabbit className="size-3" />,
      };
    }
    if (tag === recommendedAccurateModel) {
      return {
        label: "Accurate",
        color: "sky",
        icon: <CircleCheck className="size-3" />,
      };
    }
    if (tag === recommendedGoodBalanceModel) {
      return {
        label: "Good Balance",
        color: "purple",
        icon: <Scale className="size-3" />,
      };
    }
    return null;
  };

  return (
    <div
      key={model.id}
      className={`flex w-full items-center justify-between rounded-lg border p-4 ${
        selectedModel?.id === model.id
          ? `border-orange-600 ${resolvedTheme === "dark" ? "bg-orange-950" : "bg-orange-50"}`
          : `border-foreground/10 hover:border-foreground/20`
      } cursor-pointer transition-colors`}
      onClick={() => setSelectedModel(model)}
    >
      {getFeaturedModelStyle(model.tag) && (
        <div className="flex w-full flex-col">
          <div className="flex w-full justify-between">
            <div className="flex gap-3">
              <ModelIcon tag={model.tag} />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">
                  {model.provider?.name}
                </span>
                <span className="text-sm">{model.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">
                Input (1M):{" "}
                <span className="text-foreground">
                  ${Number(model.inputPerMillionTokenCost ?? 0).toFixed(2)}
                </span>
              </span>
              <span className="text-muted-foreground text-xs">
                Output (1M):{" "}
                <span className="text-foreground">
                  ${Number(model.outputPerMillionTokenCost).toFixed(2)}
                </span>
              </span>
            </div>

            <Badge
              variant={
                getFeaturedModelStyle(model.tag)?.color as BadgeProps["variant"]
              }
            >
              <div className="flex items-center gap-1">
                {getFeaturedModelStyle(model.tag)?.icon}
                {getFeaturedModelStyle(model.tag)?.label}
              </div>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
