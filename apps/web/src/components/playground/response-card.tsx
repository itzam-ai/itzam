import { MessageSquareText } from "lucide-react";
import EmptyStateDetails from "~/components/empty-state/empty-state-detais";
import { ResponseTextArea } from "~/components/playground/response-text-area";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "../ui/skeleton";

export function ResponseCard({
  output,
  isLoading,
  streamStatus,
}: {
  output: string;
  isLoading: boolean;
  streamStatus: "loading" | "streaming" | "completed" | "error" | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Response</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {output || streamStatus === "streaming" ? (
          <ResponseTextArea>{output}</ResponseTextArea>
        ) : isLoading || streamStatus === "loading" ? (
          <div className="space-y-4">
            <div className="space-y-2 px-6 pb-6">
              <Skeleton className="h-[336px] w-full" />
            </div>
          </div>
        ) : (
          <div className="flex h-[336px] items-center justify-center">
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
