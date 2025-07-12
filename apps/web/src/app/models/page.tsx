import { getAvailableModelsWithCost } from "@itzam/server/db/model/actions";
import { Brain, Code, Eye } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import ProviderIcon from "public/models/svgs/provider-icon";
import { CTA } from "~/components/landing/cta";
import { Footer } from "~/components/landing/footer";
import { NavBar } from "~/components/landing/navbar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { groupModelsByProviderAndSort } from "~/lib/providers";
import { formatCurrency, formatNumber } from "~/lib/utils";

export default async function ModelsPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between bg-background px-6 xl:px-0">
      <NavBar />

      <div className="mx-auto flex max-w-4xl pt-32">
        <Models />
      </div>

      <section id="cta" className="pt-24 pb-16">
        <CTA />
      </section>

      <Footer />
    </div>
  );
}

async function Models() {
  const models = await getAvailableModelsWithCost();

  const sortedProviderEntries = groupModelsByProviderAndSort(models);

  return (
    <section
      id="models"
      className="flex max-w-4xl w-[56rem] flex-col gap-2 px-6 pt-12 pb-16 xl:px-0"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex max-w-[calc(100%-150px)] flex-col gap-2">
          <h1 className="font-semibold text-3xl">Models</h1>
          <p className="text-lg text-muted-foreground">
            Updated list of all the models available to you.
          </p>
        </div>

        <Button variant="outline">
          <Link href="mailto:founders@itz.am">Request a model</Link>
        </Button>
      </div>

      <Card className="mt-4 py-6 px-4">
        <CardContent>
          <div className="space-y-6">
            {sortedProviderEntries.map(({ providerName, models }) => (
              <div key={providerName} className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-sm">
                    <thead>
                      <tr className="border-muted-foreground/20 border-b text-muted-foreground">
                        <th className="pt-2 pb-3 text-left font-normal w-[32%]">
                          <div className="flex items-center gap-2">
                            <ProviderIcon
                              id={models[0]?.providerId ?? ""}
                              size="sm"
                            />
                            <h3 className="font-medium text-base text-foreground">
                              {providerName}
                            </h3>
                          </div>
                        </th>
                        <th className="pt-2 pb-3 text-left font-normal text-xs w-[28%]">
                          Capabilities
                        </th>
                        <th className="pt-2 pb-3 text-right font-normal text-xs w-[15%]">
                          Input (1M)
                        </th>
                        <th className="pt-2 pb-3 text-right font-normal text-xs w-[15%]">
                          Output (1M)
                        </th>
                        <th className="pt-2 pb-3 text-right font-normal text-xs w-[15%]">
                          Context Window
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-1"></tr>
                      {models
                        .sort(
                          (a, b) =>
                            b.createdAt.getTime() - a.createdAt.getTime(),
                        )
                        .map((model) => (
                          <tr key={model.id}>
                            <td className="flex items-center gap-2 truncate py-2 ml-1">
                              <ModelIcon tag={model.tag} size="xs" />
                              <span>{model.name}</span>
                            </td>
                            <td className="py-2 text-left text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {model.hasReasoningCapability && (
                                  <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-600/10 text-green-600 hover:bg-green-600/20 cursor-pointer border border-green-600/20 hover:border-green-600/30 transition-all duration-200">
                                          <Brain className="size-2.5" />
                                          <p className="text-xs font-medium">
                                            Reasoning
                                          </p>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Thinks before answering</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {model.hasVision && (
                                  <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-600/10 text-sky-600 hover:bg-sky-600/20 cursor-pointer border border-sky-600/20 hover:border-sky-600/30 transition-all duration-200">
                                          <Eye className="size-2.5" />
                                          <p className="text-xs font-medium">
                                            Vision
                                          </p>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Vision capability (image input)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {model.isOpenSource && (
                                  <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-600/10 text-orange-600 hover:bg-orange-600/20 cursor-pointer border border-orange-600/20 hover:border-orange-600/30 transition-all duration-200">
                                          <Code className="size-2.5" />
                                          <p className="text-xs font-medium">
                                            Open Source
                                          </p>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Open Source</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {formatCurrency(
                                Number(model.inputPerMillionTokenCost ?? 0),
                              )}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {formatCurrency(
                                Number(model.outputPerMillionTokenCost ?? 0),
                              )}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {formatNumber(model.contextWindowSize)}
                            </td>
                          </tr>
                        ))}
                      <tr className="h-1"></tr>
                    </tbody>
                  </table>

                  <div className="flex justify-end border-muted-foreground/20 border-t pt-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
