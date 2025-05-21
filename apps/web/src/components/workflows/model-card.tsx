import { type ModelWithProvider } from "@itzam/server/db/model/actions";
import { Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import ModelIcon from "public/models/svgs/model-icon";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "../ui/button";

export function ModelCard({
  model,
  workflowId,
}: {
  model: ModelWithProvider | undefined;
  workflowId: string;
}) {
  if (!model) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <p>Model</p>
          <Sparkles className="size-4 text-muted-foreground/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ModelIcon tag={model.tag} size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm tracking-tight">
                {model.name}
              </h3>
            </div>
            <span className="text-muted-foreground text-xs">
              {model.provider?.name ||
                (model.providerId
                  ? `Provider ID: ${model.providerId}`
                  : "Unknown provider")}
            </span>
          </div>
        </div>

        <Link href={`/dashboard/workflows/${workflowId}/model`}>
          <Button size="icon" variant="outline">
            <Pencil className="size-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
