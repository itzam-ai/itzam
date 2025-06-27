import { ModelWithProvider } from "@itzam/server/db/model/actions";
import { AlertTriangle, MessageSquareText } from "lucide-react";
import ModelIcon from "public/models/svgs/model-icon";
import EmptyStateDetails from "~/components/empty-state/empty-state-detais";
import { ResponseTextArea } from "~/components/playground/response-text-area";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { TextShimmer } from "../ui/text-shimmer";

export function ResponseCard({
  output,
  model,
  isLoading,
  streamStatus,
}: {
  output: string;
  model: ModelWithProvider | null;
  isLoading: boolean;
  streamStatus: "loading" | "streaming" | "completed" | "error" | null;
}) {
  return (
    <Card className="h-full relative bg-transparent">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">Response</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 h-full">
        {streamStatus === "error" && (
          <div className="flex items-center gap-2 p-6 pt-4">
            <AlertTriangle className="size-4 text-red-500" />
            <p className="text-sm text-red-500">{output}</p>
          </div>
        )}

        {isLoading && streamStatus !== "streaming" && (
          <div className="flex items-center gap-2 p-6 pt-4">
            <ModelIcon tag={model?.tag ?? "unknown"} size="xs" />
            <TextShimmer className="font-mono text-xs" duration={2}>
              {`${model?.name ?? "Model"} is thinking...`}
            </TextShimmer>
          </div>
        )}

        {output &&
          (streamStatus === "streaming" || streamStatus === "completed") && (
            <ResponseTextArea>{output}</ResponseTextArea>
          )}

        {output === "" && streamStatus === null && !isLoading && (
          <div className="flex items-center justify-center h-full absolute top-0 left-0 w-full">
            <EmptyStateDetails
              title="No response yet"
              description="Test your workflow by clicking the generate button"
              icon={<MessageSquareText />}
              className="flex items-center justify-center"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
