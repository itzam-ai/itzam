import { Bot } from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { BorderTrail } from "../ui/border-trail";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

const initialBillingInformation = [
  {
    providerId: "openai",
    providerName: "OpenAI",
    totalCost: 1382.137088,
    models: [
      {
        modelId: "019610b6-df9b-70cc-98ed-336ad9327223",
        modelName: "GPT 4o",
        modelTag: "openai:gpt-4o",
        providerId: "openai",
        providerName: "OpenAI",
        cost: 418.246904,
        count: 86,
        inputTokens: 41963,
        outputTokens: 44341,
      },
      {
        modelId: "019610b6-dfa9-71c1-b50a-524cc8560980",
        modelName: "o3 Mini",
        modelTag: "openai:o3-mini",
        providerId: "openai",
        providerName: "OpenAI",
        cost: 451.06988299999995,
        count: 96,
        inputTokens: 50963,
        outputTokens: 46066,
      },
    ],
  },
  {
    providerId: "anthropic",
    providerName: "Anthropic",
    totalCost: 989.6380060000001,
    models: [
      {
        modelId: "019610b6-dfb1-7338-ac99-0990c83c2a31",
        modelName: "Claude 3.5 Haiku",
        modelTag: "anthropic:claude-3-5-haiku-20241022",
        providerId: "anthropic",
        providerName: "Anthropic",
        cost: 406.02041200000025,
        count: 80,
        inputTokens: 36314,
        outputTokens: 39219,
      },
      {
        modelId: "019610b6-dfab-74b9-8d6c-0837f5b2d034",
        modelName: "Claude 3.7 Sonnet",
        modelTag: "anthropic:claude-3-7-sonnet-20250219",
        providerId: "anthropic",
        providerName: "Anthropic",
        cost: 583.6175939999998,
        count: 103,
        inputTokens: 52957,
        outputTokens: 52534,
      },
    ],
  },
  {
    providerId: "google",
    providerName: "Google",
    totalCost: 512.106874,
    models: [
      {
        modelId: "019610b6-dfbd-76e3-8ae6-5da3198a9c57",
        modelName: "Gemini 2.0 Flash",
        modelTag: "google:gemini-2.0-flash",
        providerId: "google",
        providerName: "Google",
        cost: 512.106874,
        count: 105,
        inputTokens: 56498,
        outputTokens: 52232,
      },
    ],
  },
];

export const UnifiedBillingCard = () => {
  const [billingInformation, setBillingInformation] = useState(
    initialBillingInformation,
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setBillingInformation((prev) => {
        return prev.map((provider) => {
          if (provider.providerId === "google") {
            return {
              ...provider,
              totalCost: provider.totalCost + 7,
              models: provider.models.map((model) => ({
                ...model,
                cost: model.cost + 7,
                count: model.count + 1,
                inputTokens: model.inputTokens + 220,
                outputTokens: model.outputTokens + 1490,
              })),
            };
          }

          if (provider.providerId === "openai") {
            return {
              ...provider,
              totalCost: provider.totalCost + 10,
              models: provider.models.map((model) => ({
                ...model,
                cost: model.cost + 10,
                count: model.count + 1,
                inputTokens: model.inputTokens + 2980,
                outputTokens: model.outputTokens + 1290,
              })),
            };
          }

          if (provider.providerId === "anthropic") {
            return {
              ...provider,
              totalCost: provider.totalCost + 25,
              models: provider.models.map((model) => ({
                ...model,
                cost: model.cost + 25,
                count: model.count + 2,
                inputTokens: model.inputTokens + 180,
                outputTokens: model.outputTokens + 92,
              })),
            };
          }

          return provider;
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="px-4 py-4 shadow-sm">
      <BorderTrail
        color="neutral"
        duration={20}
        size={0}
        style={{
          boxShadow:
            "0px 0px 60px 30px rgb(128 128 128 / 50%), 0 0 100px 60px rgb(96 96 96 / 50%), 0 0 140px 90px rgb(64 64 64 / 50%)",
        }}
      />
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center justify-between text-lg">
          <p>Providers</p>
          <Bot className="size-4 text-muted-foreground/50" />
        </CardTitle>
        <CardDescription>Cost breakdown by provider and model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {billingInformation.map((provider) => (
            <div key={provider.providerId} className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed overflow-hidden text-sm">
                  <thead>
                    <tr className="border-muted-foreground/20 border-b text-muted-foreground">
                      <th className="w-[60%] py-2 text-left font-normal md:w-[45%] pl-1 pb-3">
                        <div className="flex items-center gap-2">
                          <ProviderIcon id={provider.providerId} size="xs" />
                          <h3 className="font-medium text-sm text-foreground">
                            {provider.providerName}
                          </h3>
                        </div>
                      </th>
                      <th className="hidden w-[18%] py-2 pb-1 text-right font-normal md:table-cell">
                        Requests
                      </th>
                      <th className="hidden w-[18%] py-2 pb-1 text-right font-normal md:table-cell">
                        Tokens
                      </th>
                      <th className="w-[40%] py-2 pb-1 text-right font-normal md:w-[19%]">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="overflow-hidden">
                    <tr className="h-1"></tr>
                    {provider.models
                      .sort((a, b) => b.cost - a.cost)
                      .map((model) => (
                        <tr key={model.modelId}>
                          <td className="flex w-[80%] items-center gap-2 truncate py-2 md:w-[45%] pl-1">
                            <ModelIcon tag={model.modelTag} size="xs" />
                            <span className="truncate">{model.modelName}</span>
                          </td>
                          <td className="hidden w-[18%] py-2 text-right text-muted-foreground md:table-cell">
                            <NumberFlow value={model.count} />
                          </td>
                          <td className="hidden w-[18%] py-2 text-right text-muted-foreground md:table-cell">
                            <NumberFlow
                              value={model.inputTokens + model.outputTokens}
                            />
                          </td>
                          <td className="w-[40%] overflow-hidden py-2 text-right text-muted-foreground md:w-[19%]">
                            <NumberFlow
                              value={model.cost}
                              format={{
                                currency: "USD",
                                maximumFractionDigits: 2,
                              }}
                              prefix="$"
                            />
                          </td>
                        </tr>
                      ))}
                    <tr className="h-1"></tr>
                  </tbody>
                </table>

                <div className="flex justify-end overflow-hidden border-muted-foreground/20 border-t pt-2">
                  <NumberFlow
                    value={provider.totalCost}
                    format={{ currency: "USD", maximumFractionDigits: 2 }}
                    prefix="$"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
